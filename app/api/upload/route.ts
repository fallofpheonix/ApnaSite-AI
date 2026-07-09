import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import {
  UPLOADS_DIR,
  ALLOWED_IMAGE_TYPES,
  isCloudStorage,
  s3Upload,
  s3FileUrl,
} from "@/lib/uploads";

// POST /api/upload — product photo upload.
//
// When S3/R2 is configured (S3_ENDPOINT + S3_BUCKET + S3_ACCESS_KEY +
// S3_SECRET_KEY), files are uploaded to cloud storage and the public URL
// is returned. Otherwise, falls back to local disk served by
// app/uploads/[name]/route.ts.

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — plenty for a phone photo after browser downscaling

// Magic-byte signatures so a renamed .exe can't sneak in as "image/png".
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === "image/png")
    return buf.length > 7 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/webp")
    return buf.length > 11 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  // Uploads consume disk, so they get their own rate bucket.
  const limit = await rateLimit(`upload:user:${user.id}`, 30, 5 * 60 * 1000);
  const byIp = await rateLimit(`upload:ip:${clientIp(req)}`, 60, 5 * 60 * 1000);
  if (!limit.ok || !byIp.ok) {
    const retry = Math.max(limit.retryAfterSeconds, byIp.retryAfterSeconds);
    return NextResponse.json(
      { error: `Too many uploads. Try again in about ${retry} seconds.` },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file in the upload." }, { status: 400 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP photos are allowed." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That photo is too large. Please keep it under 4 MB." },
      { status: 413 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(buf, file.type)) {
    return NextResponse.json({ error: "That file doesn't look like a photo." }, { status: 415 });
  }

  // Random server-chosen name: never trust the client filename.
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  try {
    if (isCloudStorage()) {
      // Cloud storage path (S3 / Cloudflare R2)
      const key = `uploads/${name}`;
      await s3Upload(key, buf, file.type);
      const url = await s3FileUrl(key);
      return NextResponse.json({ url }, { status: 201 });
    }

    // Local disk fallback
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, name), buf);
    return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
  } catch (err) {
    console.error("Photo upload failed:", err);
    return NextResponse.json(
      { error: "Couldn't save the photo. Try again or use a smaller photo." },
      { status: 500 }
    );
  }
}
