"use client";

// Friendly publish-limit prompt: bottom sheet on phones (thumb-reachable),
// centered dialog from sm: up. Shown when the API returns
// code: "publish_limit_reached" — never for generic errors.

interface UpgradeSheetProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function UpgradeSheet({ open, message, onClose }: UpgradeSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="stage-enter relative w-full rounded-t-3xl bg-card p-6 pb-8 shadow-xl sm:max-w-md sm:rounded-3xl sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />
        <p className="text-3xl" aria-hidden>
          🚀
        </p>
        <h2 id="upgrade-title" className="mt-2 font-display text-2xl text-ink">
          Ready for more sites?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/billing"
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-marigold px-6 text-base font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper"
          >
            See plans
          </a>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl px-6 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
