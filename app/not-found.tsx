import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-jali flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-center">
      <p className="font-display text-6xl italic text-ink" aria-hidden>
        404
      </p>
      <h1 className="mt-3 font-display text-2xl text-ink">This page doesn&apos;t exist</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        The link may be old, or the site it pointed to was unpublished by its owner.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-[44px] items-center rounded-xl bg-marigold px-6 font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper"
      >
        Go to ApnaSite AI
      </Link>
    </main>
  );
}
