import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonReq, prisma } from "./helpers";

// Mock the provider module: emailConfigured() true flips lib/auth into
// "email" delivery mode; sendOtpEmail is intercepted so no network happens.
vi.mock("@/lib/email", () => ({
  emailConfigured: vi.fn(() => true),
  emailFrom: vi.fn(() => "ApnaSite AI <test@test.local>"),
  sendOtpEmail: vi.fn(async () => {}),
}));

import { sendOtpEmail } from "@/lib/email";
import { POST as requestOtp } from "@/app/api/auth/request-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";

const sendMock = vi.mocked(sendOtpEmail);

beforeEach(() => {
  sendMock.mockClear();
});

describe("OTP email delivery", () => {
  it("sends the code to the requesting address, and the emailed code logs in", async () => {
    const email = "otp-email-ok@test.local";
    const res = await requestOtp(jsonReq("/api/auth/request-otp", { body: { email } }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toMatch(/sent a 6-digit code/i);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const [to, code] = sendMock.mock.calls[0];
    expect(to).toBe(email);
    expect(code).toMatch(/^\d{6}$/);

    // The exact code handed to the email provider is the one that verifies.
    const verify = await verifyOtp(jsonReq("/api/auth/verify-otp", { body: { email, code } }));
    expect(verify.status).toBe(200);
    expect(verify.headers.get("set-cookie")).toContain("vox_session=");
  });

  it("returns a friendly retry error when the provider fails, logging the real one", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValueOnce(new Error("Resend API error 500: boom"));

    const email = "otp-email-fail@test.local";
    const res = await requestOtp(jsonReq("/api/auth/request-otp", { body: { email } }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/couldn't send the code/i);

    // Real provider error stays server-side only.
    expect(errSpy).toHaveBeenCalledWith("OTP email send failed:", expect.any(Error));
    errSpy.mockRestore();

    // A retry replaces the undelivered code and succeeds.
    const retry = await requestOtp(jsonReq("/api/auth/request-otp", { body: { email } }));
    expect(retry.status).toBe(200);
    expect(await prisma.otpCode.count({ where: { email } })).toBe(1);
  });
});
