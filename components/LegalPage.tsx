import Link from "next/link";
// Shared shell for /terms and /privacy: readable measure, mobile padding,
// and an unmissable draft banner until the owner has reviewed the text.
export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="font-display text-xl italic text-ink">
          ApnaSite AI
        </Link>

        <div className="mt-6 rounded-xl border border-marigold/40 bg-marigold-soft/50 px-4 py-3 text-sm text-ink">
          <strong>Draft.</strong> This page is a plain-language draft awaiting review — it is not
          final and not legal advice.
        </div>

        <h1 className="mt-6 font-display text-3xl text-ink">{title}</h1>
        <p className="mt-1 text-xs text-ink-soft">Last updated: July 4, 2026</p>

        <div className="legal-prose mt-6">{children}</div>

        <p className="mt-10 border-t border-ink/10 pt-6 text-center text-xs text-ink-soft">
          <a href="/terms" className="underline hover:text-ink">
            Terms
          </a>
          {" · "}
          <a href="/privacy" className="underline hover:text-ink">
            Privacy
          </a>
          {" · "}
          <Link href="/" className="underline hover:text-ink">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
