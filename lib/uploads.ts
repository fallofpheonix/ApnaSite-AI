import path from "path";

// Where uploaded product photos live on disk. Deliberately OUTSIDE public/:
// `next start` only serves public/ files that existed at build time, so
// runtime uploads placed there would 404 in production. Files here are
// served by app/uploads/[name]/route.ts instead.
//
// On a VPS, point UPLOADS_DIR at a persistent path (e.g. /var/lib/voxsite/
// uploads) so redeploys don't touch it. On serverless hosts (Vercel) local
// disk doesn't persist at all — swap the storage calls in
// app/api/upload/route.ts for S3/R2/Vercel Blob; this constant and the
// serving route then simply fall out of use.
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
