"use client";

import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  email: string;
}

/**
 * Client-side login state. `user` is:
 *   undefined → still checking (don't flash a login prompt yet)
 *   null      → checked, not logged in
 *   {email}   → logged in
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setUser(json.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }, []);

  return { user, logout };
}
