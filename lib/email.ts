// Transactional email via the Resend REST API — same direct-fetch approach
// as lib/razorpay.ts (no SDK dependency). Env:
//   RESEND_API_KEY  enables real sending; absent → lib/auth.ts falls back to
//                   console codes in dev / fail-closed in production
//   EMAIL_FROM      verified sender, e.g. "ApnaSite AI <login@apnasite.in>".
//                   Defaults to Resend's shared test sender, which only
//                   delivers to the Resend account owner's own inbox — fine
//                   for smoke tests, useless for real users. Domain
//                   verification steps are in DEPLOY.md.

const RESEND_API = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "ApnaSite AI <onboarding@resend.dev>";
}

/** Sends the 6-digit login code. Throws (with the provider's response in the
 * message) on any non-2xx — callers decide how to surface that. */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to,
      subject: `${code} is your ApnaSite login code`,
      text: `Your ApnaSite login code is ${code}. It expires in 10 minutes.\n\nIf you didn't request it, you can ignore this email.`,
      html: otpEmailHtml(code),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body.slice(0, 300)}`);
  }
}

/** Bazaar Warmth in email-safe HTML: paper background, cream card, the code
 * big and centered in ink, teal wordmark. Tables + inline styles only —
 * email clients ignore everything else. `code` is server-generated digits. */
function otpEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#FBF1DE;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBF1DE;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="420" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;background-color:#FFFBF2;border:1px solid #E5D9C3;border-radius:16px;">
            <tr>
              <td style="padding:32px 32px 24px;font-family:Georgia,'Times New Roman',serif;">
                <p style="margin:0;font-size:22px;font-style:italic;color:#1E5C58;">ApnaSite AI</p>
                <p style="margin:20px 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#5A4A3A;">
                  Your login code:
                </p>
                <p style="margin:8px 0;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:40px;font-weight:bold;letter-spacing:10px;color:#2B211A;">
                  ${code}
                </p>
                <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#5A4A3A;">
                  It expires in <strong>10 minutes</strong>.
                </p>
                <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#5A4A3A;">
                  Didn't request this? You can safely ignore this email — nobody can log in without the code.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5A4A3A;">
            ApnaSite AI — websites for small shops
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
