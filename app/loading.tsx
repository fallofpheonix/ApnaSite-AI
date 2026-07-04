// Route-transition loading state (all main routes inherit this).
export default function Loading() {
  return (
    <main className="bg-jali flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <span
        aria-hidden
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-marigold border-t-transparent"
      />
      <p className="mt-4 text-sm text-ink-soft" role="status">
        Loading…
      </p>
    </main>
  );
}
