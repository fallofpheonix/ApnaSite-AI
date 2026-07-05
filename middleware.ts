import { NextRequest, NextResponse } from "next/server";

// CSRF backstop for the whole API: a state-changing request arriving from a
// different origin (a malicious page auto-submitting a form, a cross-site
// fetch) is rejected before any route handler runs.
//
// When Origin is absent the request passes through: same-origin GET-initiated
// navigations, curl, server-to-server callers (the Razorpay webhook) don't
// send one. Browsers DO send Origin on all cross-origin state-changing
// requests, which is the attack this guards against. Auth cookies are also
// SameSite, so this is defense in depth, not the only line.
const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  if (!STATE_CHANGING.has(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  if (!origin) return NextResponse.next();

  const host = req.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    // Unparseable Origin (including the literal "null" from sandboxed
    // iframes/opaque origins) — treat as cross-origin.
  }

  if (!host || originHost !== host) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
