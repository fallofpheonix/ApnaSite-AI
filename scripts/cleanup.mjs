// `npm run cleanup` — reclaims rows and files that only exist to expire:
//   - sessions past their expiry
//   - OTP codes past their expiry
//   - webhook-event dedup records older than 90 days (Razorpay retries span
//     days at most; 90 is generous)
//   - orphaned upload files: photos on disk that no site references anymore
//     (owner deleted the product/site, or swapped the photo)
// Run manually, or from cron on a VPS:  17 4 * * * cd /srv/apnasite && npm run cleanup
//
// Pass --dry-run to report what WOULD be removed without touching anything.
import { PrismaClient } from "@prisma/client";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run");

// Kept in sync with lib/uploads.ts — this plain-Node script can't import the TS
// module. UPLOAD_NAME_RE is the safety guard: we only ever delete files whose
// names match the server-generated upload shape, never anything else that
// happens to sit in the directory.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const UPLOAD_NAME_RE = /^[0-9]+-[a-f0-9]+\.(jpg|png|webp)$/;

// A photo is uploaded before the site that references it is saved, so a fresh
// file looks orphaned until the owner hits save. Never sweep anything younger
// than this, so the cleanup can't race an in-progress upload.
const MIN_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();
const now = new Date();
const webhookCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

// ── expired rows ────────────────────────────────────────────────────────────
if (dryRun) {
  const [sessions, otps, webhookEvents] = await Promise.all([
    prisma.session.count({ where: { expiresAt: { lt: now } } }),
    prisma.otpCode.count({ where: { expiresAt: { lt: now } } }),
    prisma.webhookEvent.count({ where: { createdAt: { lt: webhookCutoff } } }),
  ]);
  console.log(
    `cleanup (dry-run): would delete ${sessions} expired sessions, ${otps} expired OTP codes, ${webhookEvents} old webhook events`
  );
} else {
  const [sessions, otps, webhookEvents] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.otpCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.webhookEvent.deleteMany({ where: { createdAt: { lt: webhookCutoff } } }),
  ]);
  console.log(
    `cleanup: ${sessions.count} expired sessions, ${otps.count} expired OTP codes, ${webhookEvents.count} old webhook events`
  );
}

// ── orphaned upload files ───────────────────────────────────────────────────
await sweepOrphanedUploads();

await prisma.$disconnect();

/**
 * Deletes upload files no site references. The set of referenced photos is the
 * source of truth: every product image across every site's JSON `data`. A file
 * on disk that isn't in that set (and is old enough, and matches the upload
 * name shape) is dead weight and gets removed.
 */
async function sweepOrphanedUploads() {
  let files;
  try {
    files = await readdir(UPLOADS_DIR);
  } catch (err) {
    if (err.code === "ENOENT") {
      // No uploads dir (e.g. serverless deploy where photos live in blob
      // storage) — nothing on local disk to sweep.
      console.log("cleanup: no uploads directory, skipping orphan sweep");
      return;
    }
    throw err;
  }

  // Every "/uploads/<name>" referenced by any site, reduced to bare filenames.
  const referenced = new Set();
  const sites = await prisma.site.findMany({ select: { data: true } });
  for (const site of sites) {
    let data;
    try {
      data = JSON.parse(site.data);
    } catch {
      continue; // Unparseable row — leave its (unknown) photos alone.
    }
    for (const product of data?.products ?? []) {
      if (typeof product?.image === "string" && product.image) {
        referenced.add(path.basename(product.image));
      }
    }
  }

  const ageCutoff = Date.now() - MIN_ORPHAN_AGE_MS;
  let deleted = 0;
  let bytes = 0;
  let skippedRecent = 0;

  for (const name of files) {
    if (!UPLOAD_NAME_RE.test(name)) continue; // never touch unexpected files
    if (referenced.has(name)) continue; // still in use

    const full = path.join(UPLOADS_DIR, name);
    let info;
    try {
      info = await stat(full);
    } catch {
      continue; // vanished between readdir and stat — fine
    }
    if (!info.isFile()) continue;
    if (info.mtimeMs > ageCutoff) {
      skippedRecent++; // too fresh; may be an upload not yet saved to a site
      continue;
    }

    bytes += info.size;
    if (dryRun) {
      console.log(`cleanup (dry-run): would delete orphaned upload ${name} (${info.size} bytes)`);
    } else {
      try {
        await unlink(full);
        console.log(`cleanup: deleted orphaned upload ${name} (${info.size} bytes)`);
      } catch (err) {
        console.error(`cleanup: failed to delete ${name}: ${err.message}`);
        continue;
      }
    }
    deleted++;
  }

  const verb = dryRun ? "would reclaim" : "reclaimed";
  const recentNote = skippedRecent ? `, ${skippedRecent} left (too recent)` : "";
  console.log(
    `cleanup: ${deleted} orphaned upload(s), ${verb} ${(bytes / 1024).toFixed(1)} KB${recentNote}`
  );
}
