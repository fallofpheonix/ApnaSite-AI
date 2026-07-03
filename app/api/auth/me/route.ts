import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// Returns 200 with user:null (rather than a 401) when logged out, so pages
// can check login state without red errors in the browser console.
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  return NextResponse.json({ user: user ? { email: user.email } : null });
}
