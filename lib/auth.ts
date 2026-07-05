import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";
import { emailConfigured, sendOtpEmail } from "./email";

export const SESSION_COOKIE = "vox_session";
const OTP_TTL_MS = 10 * 60 * 1000; // codes are valid for 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class OtpDeliveryUnavailableError extends Error {
  constructor() {
    super("OTP delivery is not configured.");
  }
}

export class OtpSendFailedError extends Error {
  constructor() {
    super("OTP email could not be sent.");
  }
}

export type OtpDeliveryMode = "email" | "console" | "unavailable";

/** How login codes reach the user on this server:
 *  - "email"       RESEND_API_KEY is set → real email
 *  - "console"     dev (or explicitly allowed) → server console
 *  - "unavailable" production without a provider → fail closed */
export function otpDeliveryMode(): OtpDeliveryMode {
  if (emailConfigured()) return "email";
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_CONSOLE_OTP_IN_PRODUCTION === "true"
  ) {
    return "console";
  }
  return "unavailable";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Creates a 6-digit login code for this email and delivers it per
 * otpDeliveryMode(): Resend email when configured, server console in dev,
 * fail-closed in production without a provider. */
export async function requestOtp(email: string): Promise<void> {
  const mode = otpDeliveryMode();
  if (mode === "unavailable") {
    throw new OtpDeliveryUnavailableError();
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  // One outstanding code per email: a new request invalidates older codes.
  // Stored before sending — a failed send leaves a code the user never saw,
  // which the next request simply replaces.
  await prisma.otpCode.deleteMany({ where: { email } });
  await prisma.otpCode.create({
    data: {
      email,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  if (mode === "email") {
    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      // The real provider error stays server-side; the user gets a retry.
      console.error("OTP email send failed:", err);
      throw new OtpSendFailedError();
    }
  } else {
    // DEV MODE: no email provider, so the code goes to the server console.
    console.log(`\n  [ApnaSite login code] ${email}  →  ${code}\n`);
  }
}

export type VerifyResult =
  | { ok: true; token: string; userId: string }
  | { ok: false; error: string };

/** Checks a submitted code. On success creates the user (first login doubles
 * as signup) and a session row, and returns the session token to be set as a
 * cookie by the caller. */
export async function verifyOtp(email: string, code: string): Promise<VerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "That code has expired. Request a new one." };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  const submitted = Buffer.from(sha256(code.trim()));
  const stored = Buffer.from(record.codeHash);
  const matches = submitted.length === stored.length && timingSafeEqual(submitted, stored);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "That code doesn't match. Check the digits and try again." };
  }

  await prisma.otpCode.deleteMany({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return { ok: true, token, userId: user.id };
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export interface SessionUser {
  id: string;
  email: string;
}

/** Resolves the logged-in user from the request's session cookie, or null. */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  return { id: session.user.id, email: session.user.email };
}

export async function destroySession(req: NextRequest): Promise<void> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}
