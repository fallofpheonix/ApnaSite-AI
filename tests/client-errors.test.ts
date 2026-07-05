import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/client-errors/route";
import { jsonReq } from "./helpers";

// The endpoint is unauthenticated and attacker-reachable, so the tests focus
// on the abuse valves: the payload cap and the per-IP rate limit. Each test
// uses its own x-forwarded-for so the shared in-memory limiter can't bleed
// between tests.

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
});

function beaconReq(body: unknown, ip: string) {
  return jsonReq("/api/client-errors", { body, headers: { "x-forwarded-for": ip } });
}

describe("client-error beacon", () => {
  it("logs a well-formed report with the [client-error] prefix and returns 204", async () => {
    const res = await POST(
      beaconReq(
        { message: "boom", url: "https://x.test/page", line: 42, userAgent: "TestBrowser" },
        "10.0.0.1"
      )
    );
    expect(res.status).toBe(204);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("[client-error] boom"));
  });

  it("rejects oversized payloads without logging them", async () => {
    const res = await POST(beaconReq({ message: "x".repeat(20_000) }, "10.0.0.2"));
    expect(res.status).toBe(413);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("rate-limits per IP", async () => {
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await POST(beaconReq({ message: `err ${i}` }, "10.0.0.3"));
      lastStatus = res.status;
      if (i < 10) expect(res.status).toBe(204);
    }
    expect(lastStatus).toBe(429);
    // A different IP is unaffected.
    const other = await POST(beaconReq({ message: "fresh" }, "10.0.0.4"));
    expect(other.status).toBe(204);
  });

  it("accepts a CSP violation report", async () => {
    const res = await POST(
      beaconReq(
        {
          "csp-report": {
            "violated-directive": "script-src",
            "blocked-uri": "https://evil.test/x.js",
            "document-uri": "https://x.test/page",
          },
        },
        "10.0.0.5"
      )
    );
    expect(res.status).toBe(204);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("CSP violation"));
  });
});
