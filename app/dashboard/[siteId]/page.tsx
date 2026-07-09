"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import PromptEditor from "@/components/PromptEditor";
import CodeExportButton from "@/components/CodeExportButton";
import MarketingPanel from "@/components/MarketingPanel";
import DomainManager from "@/components/DomainManager";
import AppointmentManager from "@/components/AppointmentManager";
import OrderManager from "@/components/OrderManager";
import ReviewManager from "@/components/ReviewManager";
import { useAuthUser } from "@/components/useAuthUser";
import type { StorefrontData } from "@/lib/types";

type Tab = "analytics" | "prompt" | "marketing" | "reviews" | "appointments" | "orders" | "domains" | "export";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "prompt", label: "AI Editor", icon: "✨" },
  { key: "marketing", label: "Marketing", icon: "📢" },
  { key: "reviews", label: "Reviews", icon: "⭐" },
  { key: "appointments", label: "Bookings", icon: "📅" },
  { key: "orders", label: "Orders", icon: "🛒" },
  { key: "domains", label: "Domains", icon: "🌐" },
  { key: "export", label: "Export", icon: "📦" },
];

export default function SiteDashboardPage() {
  const { user, logout } = useAuthUser();
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  
  const [tab, setTab] = useState<Tab>("analytics");
  const [siteData, setSiteData] = useState<StorefrontData | null>(null);
  const [siteName, setSiteName] = useState<string>("");
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [sitePublished, setSitePublished] = useState(false);
  const [sitePublishedAt, setSitePublishedAt] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSuccess, setSlugSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}`)
      .then((res) => {
        if (res.status === 401) {
          window.location.href = `/login?next=/dashboard/${siteId}`;
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (!json.site) {
          setError(json.error || "Site not found.");
          return;
        }
        setSiteData(json.site.data);
        setSiteName(json.site.name);
        setSiteSlug(json.site.slug);
        setSitePublished(json.site.published);
        setSitePublishedAt(json.site.publishedAt ?? null);
        setSlugInput(json.site.slug ?? "");
      })
      .catch(() => setError("Failed to load site."))
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleDataUpdate = (newData: StorefrontData) => {
    setSiteData(newData);
  };

  const handleSlugSave = async () => {
    setSlugSaving(true);
    setSlugError(null);
    setSlugSuccess(false);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugInput }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSlugError(json.error || "Failed to update URL.");
        return;
      }
      setSiteSlug(json.slug);
      setSlugInput(json.slug);
      setSlugSuccess(true);
      setTimeout(() => setSlugSuccess(false), 2000);
    } catch {
      setSlugError("Failed to update URL.");
    } finally {
      setSlugSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-paper">
        <AppHeader user={user} onLogout={logout} />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-ink-soft">Loading...</div>
        <AppFooter />
      </main>
    );
  }

  if (error || !siteData) {
    return (
      <main className="min-h-screen bg-paper">
        <AppHeader user={user} onLogout={logout} />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-xl border border-brick/20 bg-brick/10 px-5 py-3 text-sm text-brick">
            {error || "Site not found."}
          </div>
          <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-teal underline">
            Back to Dashboard
          </button>
        </div>
        <AppFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader user={user} onLogout={logout} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-teal underline">
              ← Back to Dashboard
            </button>
            <h1 className="mt-1 font-display text-2xl text-ink">{siteName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sitePublished ? "bg-teal/15 text-teal" : "bg-ink/10 text-ink-soft"}`}>
                {sitePublished ? "Live" : "Draft"}
              </span>
              {sitePublished && siteSlug && (
                <a href={`/s/${siteSlug}`} target="_blank" rel="noopener" className="text-teal underline hover:text-teal-deep">
                  /s/{siteSlug}
                </a>
              )}
              {sitePublishedAt && (
                <span className="text-xs text-ink-soft">
                  Published {new Date(sitePublishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {/* Slug editor */}
            {sitePublished && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-ink-soft">URL:</span>
                <span className="text-ink-soft">/s/</span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => { setSlugInput(e.target.value); setSlugError(null); setSlugSuccess(false); }}
                  className="w-48 rounded-lg border border-ink/15 bg-transparent px-2 py-1 text-sm text-ink focus:border-teal focus:outline-none"
                  placeholder="your-url"
                />
                <button
                  onClick={handleSlugSave}
                  disabled={slugSaving || slugInput === siteSlug}
                  className="rounded-lg bg-teal px-3 py-1 text-xs font-medium text-paper transition-colors hover:bg-teal-deep disabled:opacity-50"
                >
                  {slugSaving ? "Saving..." : slugSuccess ? "Saved ✓" : "Save"}
                </button>
                {slugError && <span className="text-xs text-brick">{slugError}</span>}
              </div>
            )}
          </div>
          <a
            href={`/`}
            className="min-h-[44px] rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
          >
            Edit Site
          </a>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-ink/10 bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-teal text-paper"
                  : "text-ink-soft hover:bg-ink/5"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
          {tab === "analytics" && <AnalyticsDashboard siteId={siteId} />}
          {tab === "prompt" && <PromptEditor siteId={siteId} onDataUpdate={handleDataUpdate} />}
          {tab === "marketing" && <MarketingPanel siteId={siteId} />}
          {tab === "reviews" && <ReviewManager siteId={siteId} />}
          {tab === "appointments" && <AppointmentManager siteId={siteId} />}
          {tab === "orders" && <OrderManager siteId={siteId} />}
          {tab === "domains" && <DomainManager siteId={siteId} />}
          {tab === "export" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink">Export Your Site</h2>
              <p className="mb-4 text-sm text-ink-soft">
                Download a ZIP file containing your website as static HTML. You can host it anywhere.
              </p>
              <CodeExportButton siteId={siteId} />
            </div>
          )}
        </div>
      </div>
      <AppFooter />
    </main>
  );
}
