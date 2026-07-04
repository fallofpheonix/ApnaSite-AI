"use client";

import Link from "next/link";

// Brand-styled error boundary. Next.js renders this for uncaught errors in
// any route segment; `reset` re-renders the segment.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-jali flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        🛠️
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">Something broke on our side</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        Your sites and drafts are safe. Try again — if it keeps happening, come back in a few
        minutes.
        {error.digest && <span className="mt-2 block text-xs opacity-70">Ref: {error.digest}</span>}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-xl bg-teal px-6 font-semibold text-paper transition-colors hover:bg-teal-deep"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex min-h-[44px] items-center rounded-xl border border-ink/15 px-6 font-medium text-ink-soft transition-colors hover:bg-ink/5"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
