"use client";

import { useEffect, useState } from "react";

interface DailyViews {
  date: string;
  count: number;
}

interface TopPage {
  path: string;
  count: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  viewsThisWeek: number;
  dailyViews: DailyViews[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
}

export default function AnalyticsDashboard({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics?siteId=${siteId}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [siteId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="text-sm text-ink-soft">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-700 shadow-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const maxDaily = Math.max(...data.dailyViews.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-ink-soft">Total Views</p>
          <p className="mt-1 text-3xl font-bold text-ink">{data.totalViews.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-ink-soft">Unique Visitors</p>
          <p className="mt-1 text-3xl font-bold text-ink">{data.uniqueVisitors.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-ink-soft">Views Today</p>
          <p className="mt-1 text-3xl font-bold text-ink">{data.viewsToday.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
          <p className="text-sm text-ink-soft">Views This Week</p>
          <p className="mt-1 text-3xl font-bold text-ink">{data.viewsThisWeek.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-ink">Daily Views — Last 30 Days</p>
        <div className="flex h-40 items-end gap-1">
          {data.dailyViews.map((day) => (
            <div
              key={day.date}
              className="flex-1 rounded-t bg-teal/70 transition-colors hover:bg-teal"
              style={{ height: `${(day.count / maxDaily) * 100}%` }}
              title={`${day.date}: ${day.count}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-ink">Top Pages</p>
        {data.topPages.length === 0 ? (
          <p className="text-sm text-ink-soft">No page data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="pb-2 pr-4 font-medium">Page</th>
                  <th className="pb-2 font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((page) => (
                  <tr key={page.path} className="border-b border-ink/5 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-ink">{page.path}</td>
                    <td className="py-2 text-ink">{page.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-ink">Top Referrers</p>
        {data.topReferrers.length === 0 ? (
          <p className="text-sm text-ink-soft">No referrer data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="pb-2 pr-4 font-medium">Referrer</th>
                  <th className="pb-2 font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.topReferrers.map((referrer) => (
                  <tr key={referrer.referrer} className="border-b border-ink/5 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-ink">{referrer.referrer}</td>
                    <td className="py-2 text-ink">{referrer.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
