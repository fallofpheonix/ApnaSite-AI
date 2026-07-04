import { NextRequest, NextResponse } from "next/server";
import { OtpDeliveryUnavailableError, isValidEmail, requestOtp } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Public endpoint → rate-limited per email and per IP so it can't be used
  // to spam inboxes (or, in dev, flood the console).
  const byEmail = rateLimit(`otp:email:${email}`, 3, 10 * 60 * 1000);
  const byIp = rateLimit(`otp:ip:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!byEmail.ok || !byIp.ok) {
    const retry = Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds);
    return NextResponse.json(
      { error: `Too many code requests. Try again in about ${Math.ceil(retry / 60)} minute(s).` },
      { status: 429 }
    );
  }

  try {
    await requestOtp(email);
  } catch (err) {
    if (err instanceof OtpDeliveryUnavailableError) {
      return NextResponse.json(
        { error: "Login email delivery is not configured on this server." },
        { status: 503 }
      );
    }
    throw err;
  }

  return NextResponse.json({
    ok: true,
    message:
      process.env.NODE_ENV === "production" && process.env.ALLOW_CONSOLE_OTP_IN_PRODUCTION !== "true"
        ? "We've sent a 6-digit code to your email."
        : "Dev mode: your 6-digit code was printed in the server console (the terminal running `npm run dev`).",
  });
}
