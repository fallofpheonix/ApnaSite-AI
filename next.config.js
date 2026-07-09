// Security headers. The CSP is only sent in production — Next.js dev mode
// needs eval/websockets that would violate it. Allowed third parties:
//   fonts.googleapis.com / fonts.gstatic.com — published-site typography
//   checkout.razorpay.com / api.razorpay.com — Razorpay Checkout (script,
//     its iframe, and its API calls); lumberjack.razorpay.com is its
//     telemetry endpoint (checkout errors without it);
//     cdn.razorpay.com — risk-detection bundle checkout.js injects into the
//     parent page (verified via headless probe: checkout opens without it,
//     but the script is blocked and fraud detection silently disabled)
// 'unsafe-inline' script-src is required by Next's hydration bootstrap
// (nonce-based CSP is a later refinement); inline styles are used by the
// theme system on published pages.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Violations land in /api/client-errors and show up in the host logs.
  // report-uri is the legacy directive, report-to the modern one (paired with
  // the Reporting-Endpoints header below); browsers use whichever they know.
  "report-uri /api/client-errors",
  "report-to csp",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [
        { key: "Content-Security-Policy", value: csp },
        { key: "Reporting-Endpoints", value: 'csp="/api/client-errors"' },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Self-contained server in .next/standalone (node .next/standalone/server.js)
  // — what a VPS/systemd/Docker deploy runs; DEPLOY.md Path B relies on it.
  output: "standalone",
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
