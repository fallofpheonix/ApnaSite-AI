import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy — ApnaSite AI" };

// DRAFT privacy policy — plain language, for review by the site owner.
// Not legal advice; have a professional review before real payments.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your email address</strong> — used only to log you in (we send a 6-digit code)
          and for account-related messages. No marketing without asking first.
        </li>
        <li>
          <strong>Your site content</strong> — the business description you type or speak, the
          generated text, and every edit you make. This is the product; we store it so your site
          works.
        </li>
        <li>
          <strong>Photos you upload</strong> — product photos are stored on our server and shown
          on your published site.
        </li>
        <li>
          <strong>Subscription records</strong> — if you upgrade, we store your plan and payment
          status. Card details go directly to Razorpay and never touch our servers.
        </li>
      </ul>

      <h2>How AI is involved</h2>
      <p>
        When you generate a site, your business description is sent to Anthropic&apos;s Claude API
        to produce the website text. Don&apos;t include information in your description that you
        wouldn&apos;t want on a public website.
      </p>

      <h2>What&apos;s public</h2>
      <p>
        Anything on your published site (<code>/s/your-shop-name</code>) is public — that&apos;s
        the point. Unpublishing takes it offline. Draft sites are visible only to you.
      </p>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your data.</li>
        <li>We don&apos;t show ads.</li>
        <li>We don&apos;t read your sites except to operate the service or investigate abuse.</li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        Deleting a site from your dashboard removes it permanently. To delete your whole account
        and everything in it, email us and we&apos;ll do it within 30 days.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions:{" "}
        {SUPPORT_EMAIL ? (
          <strong>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </strong>
        ) : (
          <strong>[contact email — to be added]</strong>
        )}
      </p>
    </LegalPage>
  );
}
