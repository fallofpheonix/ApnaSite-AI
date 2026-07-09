import { prisma } from "./db";
import type { Prisma, PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

type PrismaLike = PrismaClient | Prisma.TransactionClient;
const MAX_SEQUENTIAL_SLUG_ATTEMPTS = 100;

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Non-Latin shop names (e.g. Devanagari) strip down to nothing. Without a
  // unique fallback, every such shop would collide on the same "my-site"
  // slug and silently overwrite each other's published site.
  return base || `my-site-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Returns a slug that no OTHER site in the database is using. If the base
 * slug is taken, tries base-2, base-3, ... A site that already owns a slug
 * keeps it (excludeSiteId), so republishing never changes a live URL.
 */
export async function uniqueSlugFor(
  name: string,
  excludeSiteId: string,
  db: PrismaLike = prisma
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  for (let i = 2; i <= MAX_SEQUENTIAL_SLUG_ATTEMPTS; i++) {
    const existing = await db.site.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeSiteId) return candidate;
    candidate = `${base}-${i}`;
  }

  // Avoid an unbounded query loop for heavily contended names. The database's
  // unique constraint remains the final concurrency guard at publish time.
  return `${base}-${randomBytes(6).toString("hex")}`;
}
