import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// POST /api/client-errors — the client-side blind-spot closer. Browser errors
// (window.onerror / unhandledrejection, sent by components/ErrorBeacon.tsx)
// and CSP violation reports land here and are console.error'd so they show up
// in the same host logs as server errors. No Sentry, no storage, no auth —
// which is why the caps are strict: unauthenticated, attacker-reachable, and
// must never become a log-flooding or disk-filling vector.

const MAX_BODY_BYTES = 8 * 1024;
const MAX_FIELD_CHARS = 500;

/** Clamp any client-supplied value to a short single-line string. */
function clamp(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .slice(0, MAX_FIELD_CHARS);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = await rateLimit(`client-errors:ip:${ip}`, 10, 60 * 1000);
  if (!limited.ok) return new NextResponse(null, { status: 429 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    // Garbage in, silence out — nothing here is worth a retry or an error page.
    return new NextResponse(null, { status: 204 });
  }

  if (body && typeof body === "object") {
    const report = body as Record<string, unknown>;
    if (report["csp-report"] && typeof report["csp-report"] === "object") {
      // Legacy report-uri format (one violation per POST).
      const csp = report["csp-report"] as Record<string, unknown>;
      console.error(
        `[client-error] CSP violation: ${clamp(csp["violated-directive"] ?? csp["effective-directive"])} blocked ${clamp(csp["blocked-uri"])} on ${clamp(csp["document-uri"])}`
      );
    } else if (Array.isArray(body)) {
      // Reporting API format (report-to): an array of reports.
      for (const entry of body.slice(0, 5)) {
        console.error(`[client-error] report: ${clamp(JSON.stringify(entry))}`);
      }
    } else {
      // ErrorBeacon's own payload.
      console.error(
        `[client-error] ${clamp(report.message)} at ${clamp(report.url)}:${clamp(report.line) || "?"} (${clamp(report.userAgent)})`
      );
    }
  }

  return new NextResponse(null, { status: 204 });
}
