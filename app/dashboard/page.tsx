"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import PageHeader from "@/components/PageHeader";
import UpgradeSheet from "@/components/UpgradeSheet";
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
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  // Promise-chain (not async/await) so state updates live in .then callbacks:
  // callable from the mount effect without setState-in-effect, awaitable from
  // action handlers.
  const loadSites = useCallback(() => {
    return fetch("/api/sites")
      .then((res) => res.json().then((json) => ({ res, json })))
      .then(({ res, json }) => {
        if (res.status === 401) {
          window.location.href = "/login?next=/dashboard";
          return;
        }
        if (!res.ok) {
          setError(json.error || "Couldn't load your sites.");
          return;
        }
        setSites(json.sites);
      });
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
      if (!res.ok) {
        if (json.code === "publish_limit_reached") {
          setUpgradeMessage(json.error);
          return;
        }
        throw new Error(json.error || "That didn't work.");
      }
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

      <div className="mx-auto max-w-3xl px-4 py-12">
        <PageHeader
          title="My Sites"
          subtitle={
            sites === null
              ? "Everything you've created. Edit, publish, or take a site offline."
              : `${sites.length} site${sites.length === 1 ? "" : "s"} · ${sites.filter((s) => s.published).length} live`
          }
          action={
            <Link
              href="/"
              className="flex min-h-[44px] items-center rounded-xl bg-marigold px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper"
            >
              + New Site
            </Link>
          }
        />

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
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-card px-5 py-4 shadow-sm"
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
                        className="inline-block py-1.5 text-teal underline hover:text-teal-deep"
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
                    className="flex min-h-[44px] items-center rounded-lg border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:bg-ink/5"
                  >
                    Edit
                  </a>
                  {site.published ? (
                    <button
                      type="button"
                      disabled={busyId === site.id}
                      onClick={() => act(site.id, "unpublish")}
                      className="min-h-[44px] rounded-lg border border-ink/15 px-4 py-2 font-medium text-ink-soft transition-colors hover:bg-ink/5 disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === site.id}
                      onClick={() => act(site.id, "publish")}
                      className="min-h-[44px] rounded-lg bg-teal px-4 py-2 font-semibold text-paper transition-colors hover:bg-teal-deep disabled:opacity-50"
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
                    className="min-h-[44px] rounded-lg border border-brick/30 px-4 py-2 font-medium text-brick transition-colors hover:bg-brick/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AppFooter />

      <UpgradeSheet
        open={upgradeMessage !== null}
        message={upgradeMessage ?? ""}
        onClose={() => setUpgradeMessage(null)}
      />
    </main>
  );
}
