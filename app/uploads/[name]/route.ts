import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOADS_DIR, MIME_BY_EXT, UPLOAD_NAME_RE } from "@/lib/uploads";

type Params = { params: Promise<{ name: string }> };

// GET /uploads/:name — serves uploaded product photos from UPLOADS_DIR.
// Exists because `next start` won't serve files added to public/ after the
// build. Unauthenticated on purpose: these images appear on public
// storefronts. If storage moves to S3/R2, images get bucket URLs and this
// route stops being referenced.
export async function GET(_req: NextRequest, { params }: Params) {
  const { name } = await params;

  // Strict allowlist of our own generated names — no traversal, no surprises.
  if (!UPLOAD_NAME_RE.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(path.join(UPLOADS_DIR, name));
    const ext = name.split(".").pop() as string;
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        // Names are unique-per-upload, so the content never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
