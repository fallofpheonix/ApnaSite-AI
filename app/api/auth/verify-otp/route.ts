import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, setSessionCookie, verifyOtp } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  let email: string;
  let code: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    code = typeof body?.code === "string" ? body.code.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter your email and the 6-digit code." }, { status: 400 });
  }

  const byIp = rateLimit(`verify:ip:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!byIp.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const result = await verifyOtp(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, email });
  setSessionCookie(res, result.token);
  return res;
}
