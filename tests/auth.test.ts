import { describe, expect, it } from "vitest";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import { GET as listSites } from "@/app/api/sites/route";
import { jsonReq, prisma, sha256, userWithSession } from "./helpers";

const CODE = "123456";

async function seedOtp(email: string, opts: { expiresAt?: Date; attempts?: number } = {}) {
  await prisma.otpCode.deleteMany({ where: { email } });
  return prisma.otpCode.create({
    data: {
      email,
      codeHash: sha256(CODE),
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 600_000),
      attempts: opts.attempts ?? 0,
    },
  });
}

describe("OTP verification", () => {
  it("rejects a wrong code and counts the attempt", async () => {
    const email = "otp-wrong@test.local";
    await seedOtp(email);
    const res = await verifyOtp(jsonReq("/api/auth/verify-otp", { body: { email, code: "654321" } }));
    expect(res.status).toBe(401);
    const row = await prisma.otpCode.findFirst({ where: { email } });
    expect(row?.attempts).toBe(1);
  });

  it("rejects an expired code even when it matches", async () => {
    const email = "otp-expired@test.local";
    await seedOtp(email, { expiresAt: new Date(Date.now() - 1000) });
    const res = await verifyOtp(jsonReq("/api/auth/verify-otp", { body: { email, code: CODE } }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/expired/i);
  });

  it("locks out after the attempt limit even with the right code", async () => {
    const email = "otp-locked@test.local";
    await seedOtp(email, { attempts: 5 });
    const res = await verifyOtp(jsonReq("/api/auth/verify-otp", { body: { email, code: CODE } }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/too many/i);
  });

  it("accepts the right code, creates a session cookie, and burns the code", async () => {
    const email = "otp-good@test.local";
    await seedOtp(email);
    const res = await verifyOtp(jsonReq("/api/auth/verify-otp", { body: { email, code: CODE } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("vox_session=");
    // one-time use: the code row is gone
    expect(await prisma.otpCode.count({ where: { email } })).toBe(0);
  });
});

describe("session gating", () => {
  it("rejects protected routes without a cookie", async () => {
    const res = await listSites(jsonReq("/api/sites", { method: "GET" }));
    expect(res.status).toBe(401);
  });

  it("rejects a made-up session token", async () => {
    const res = await listSites(
      jsonReq("/api/sites", { method: "GET", cookie: "vox_session=not-a-real-token" })
    );
    expect(res.status).toBe(401);
  });

  it("rejects an expired session", async () => {
    const { user } = await userWithSession("expired-session");
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const session = await prisma.session.findFirst({ where: { userId: user.id } });
    const res = await listSites(
      jsonReq("/api/sites", { method: "GET", cookie: `vox_session=${session!.token}` })
    );
    expect(res.status).toBe(401);
  });
});
