import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// S3 / Cloudflare R2 configuration
//
// Set these env vars to enable cloud storage. When S3_BUCKET is absent the
// module falls back to local disk (UPLOADS_DIR).
//
//   S3_ENDPOINT      — e.g. https://<account-id>.r2.cloudflarestorage.com
//   S3_BUCKET        — bucket / bucket name
//   S3_ACCESS_KEY    — access key id
//   S3_SECRET_KEY    — secret access key
//   S3_PUBLIC_URL    — public base URL for served files (e.g. https://pub-xxx.r2.dev)
//                      If omitted, signed URLs are used instead.
//   S3_REGION        — defaults to "auto" (Cloudflare R2)
// ---------------------------------------------------------------------------

let _s3: S3Client | null = null;

export function getS3(): S3Client | null {
  if (_s3) return _s3;
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  _s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _s3;
}

export function s3Bucket(): string {
  return process.env.S3_BUCKET || "";
}

export function s3PublicUrl(): string | null {
  return process.env.S3_PUBLIC_URL || null;
}

/** True when cloud storage is configured. */
export function isCloudStorage(): boolean {
  return getS3() !== null;
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

/** Upload a buffer to S3 and return the key. */
export async function s3Upload(key: string, buf: Buffer, contentType: string): Promise<string> {
  const s3 = getS3();
  if (!s3) throw new Error("S3 not configured");
  await s3.send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: key,
      Body: buf,
      ContentType: contentType,
    }),
  );
  return key;
}

/** Get a public URL or a short-lived signed URL for a key. */
export async function s3FileUrl(key: string): Promise<string> {
  const pub = s3PublicUrl();
  if (pub) return `${pub.replace(/\/$/, "")}/${key}`;
  const s3 = getS3();
  if (!s3) throw new Error("S3 not configured");
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: s3Bucket(), Key: key }),
    { expiresIn: 3600 },
  );
}

// ---------------------------------------------------------------------------
// Local disk fallback
// ---------------------------------------------------------------------------

export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

/** Upload MIME type → file extension we trust it with. */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Server-generated upload names look like "1712345678-a1b2c3d4e5f6.jpg".
 * Anything else (especially anything with slashes or dots) is rejected —
 * this is the path-traversal guard for the serving route. */
export const UPLOAD_NAME_RE = /^[0-9]+-[a-f0-9]+\.(jpg|png|webp)$/;
