import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import type { StorefrontData } from "@/lib/types";

export { prisma };

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** A logged-in user, created directly in the test db (no OTP dance). */
export async function userWithSession(emailPrefix: string) {
  const email = `${emailPrefix}-${randomBytes(4).toString("hex")}@test.local`;
  const user = await prisma.user.create({ data: { email } });
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
  });
  return { user, token, cookie: `${SESSION_COOKIE}=${token}` };
}

export function validData(overrides: Partial<StorefrontData> = {}): StorefrontData {
  return {
    shopName: "Test Shop",
    tagline: "A perfectly fine tagline",
    category: "general",
    aboutText: "About this shop.",
    hours: "9-5",
    products: [{ name: "Thing", description: "A thing.", price: null }],
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    language: "en",
    ...overrides,
  };
}

export async function makeSite(
  userId: string,
  opts: { published?: boolean; slug?: string | null; data?: StorefrontData } = {}
) {
  return prisma.site.create({
    data: {
      userId,
      name: opts.data?.shopName ?? "Test Shop",
      data: JSON.stringify(opts.data ?? validData()),
      published: opts.published ?? false,
      slug: opts.slug ?? null,
    },
  });
}

/** JSON request for a route handler. */
export function jsonReq(
  url: string,
  opts: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string> } = {}
) {
  return new NextRequest(`http://test.local${url}`, {
    method: opts.method ?? "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/** The { params } second argument of dynamic route handlers. */
export function routeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}
