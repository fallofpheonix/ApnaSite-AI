"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAuthUser } from "@/components/useAuthUser";

interface SiteSummary {
  id: string;
  name: string;
  slug: string | null;
  published: boolean;
  updatedAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuthUser();
  const [sites, setSites] = useState<SiteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    const res = await fetch("/api/sites");
    if (res.status === 401) {
      window.location.href = "/login?next=/dashboard";
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Couldn't load your sites.");
      return;
    }
    setSites(json.sites);
  }, []);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const act = async (id: string, action: "publish" | "unpublish" | "delete") => {
    setBusyId(id);
    setError(null);
    try {
      const res =
        action === "delete"
          ? await fetch(`/api/sites/${id}`, { method: "DELETE" })
          : await fetch(`/api/sites/${id}/${action}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "That didn't work.");
      await loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">My Sites</h1>
            <p className="text-sm text-ink-soft">
              Everything you've created. Edit, publish, or take a site offline.
            </p>
          </div>
          <a
            href="/"
            className="rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper"
          >
            + New Site
          </a>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-brick/20 bg-brick/10 px-5 py-3 text-sm text-brick">
            {error}
          </div>
        )}

        {sites === null ? (
          <p className="py-12 text-center text-ink-soft">Loading your sites...</p>
        ) : sites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-card/60 px-6 py-14 text-center">
            <p className="font-display text-xl text-ink">No sites yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Describe your business on the home page and your first site will show up here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sites.map((site) => (
              <li
                key={site.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-lg text-ink">{site.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        site.published
                          ? "bg-teal/15 text-teal"
                          : "bg-ink/10 text-ink-soft"
                      }`}
                    >
                      {site.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {site.published && site.slug ? (
                      <a
                        href={`/s/${site.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-teal underline hover:text-teal-deep"
                      >
                        /s/{site.slug}
                      </a>
                    ) : (
                      "Not published"
                    )}
                    {" · "}updated {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <a
                    href={`/?site=${site.id}`}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 font-medium text-ink transition-colors hover:bg-ink/5"
                  >
                    Edit
                  </a>
                  {site.published ? (
                    <button
                      type="button"
                      disabled={busyId === site.id}
                      onClick={() => act(site.id, "unpublish")}
                      className="rounded-lg border border-ink/15 px-3 py-1.5 font-medium text-ink-soft transition-colors hover:bg-ink/5 disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === site.id}
                      onClick={() => act(site.id, "publish")}
                      className="rounded-lg bg-teal px-3 py-1.5 font-semibold text-paper transition-colors hover:bg-teal-deep disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === site.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${site.name}"? This can't be undone.`)) {
                        void act(site.id, "delete");
                      }
                    }}
                    className="rounded-lg border border-brick/30 px-3 py-1.5 font-medium text-brick transition-colors hover:bg-brick/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
