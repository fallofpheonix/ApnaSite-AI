"use client";

import type { AuthUser } from "./useAuthUser";

interface AppHeaderProps {
  user: AuthUser | null | undefined;
  onLogout: () => void;
}

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-ink/10 bg-card/60 px-5 py-3 backdrop-blur-sm sm:px-8">
      <a href="/" className="font-display text-xl italic text-ink">
        VoxSite AI
      </a>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <a href="/dashboard" className="px-1 py-2.5 font-medium text-teal hover:text-teal-deep">
              My Sites
            </a>
            <span className="hidden text-ink-soft sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] rounded-lg border border-ink/15 px-3 py-2 font-medium text-ink-soft transition-colors hover:bg-ink/5"
            >
              Log out
            </button>
          </>
        ) : user === null ? (
          <a
            href="/login"
            className="flex min-h-[40px] items-center rounded-lg bg-teal px-4 py-2 font-semibold text-paper transition-colors hover:bg-teal-deep"
          >
            Log in
          </a>
        ) : null /* undefined = still checking; render nothing to avoid a flash */}
      </nav>
    </header>
  );
}
