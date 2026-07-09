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
      })
      .catch(() => setError("Failed to load site."))
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleDataUpdate = (newData: StorefrontData) => {
    setSiteData(newData);
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
