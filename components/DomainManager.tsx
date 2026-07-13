"use client";

import { useEffect, useState } from "react";
import { STATUS_BADGE_CLASS, STATUS_BUTTON_CLASS } from "@/lib/statusStyles";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
}

const DOMAIN_RE = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export default function DomainManager({ siteId }: { siteId: string }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDomains() {
      try {
        const res = await fetch(`/api/domains?siteId=${siteId}`);
        if (!res.ok) throw new Error("Failed to load domains");
        const data = await res.json();
        if (!cancelled) setDomains(data.domains ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDomains();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  async function handleAdd() {
    const domain = normalizeDomain(newDomain);
    if (!domain) return;
    setError(null);
    if (!DOMAIN_RE.test(domain)) {
      setError("Enter a valid domain, for example example.com.");
      return;
    }

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add domain");
      }
      const data = await res.json();
      setDomains((prev) => [...prev, data.domain]);
      setNewDomain("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add domain");
    }
  }

  async function handleVerify(domainId: string) {
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? { ...d, verified: data.verified } : d))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    }
  }

  async function handleDelete(domainId: string) {
    try {
      const res = await fetch("/api/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      if (!res.ok) throw new Error("Failed to delete domain");
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete domain");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="text-sm text-ink-soft">Loading domains...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-ink">Custom Domains</p>

      {error && (
        <div className={`rounded-xl p-3 text-sm ${STATUS_BADGE_CLASS.error}`}>
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-xl border border-ink/10 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newDomain.trim()}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-teal/90 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {domains.length === 0 ? (
        <p className="text-sm text-ink-soft">No domains added yet.</p>
      ) : (
        <div className="space-y-2">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink">{domain.domain}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    domain.verified
                      ? STATUS_BADGE_CLASS.success
                      : STATUS_BADGE_CLASS.warning
                  }`}
                >
                  {domain.verified ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!domain.verified && (
                  <button
                    type="button"
                    onClick={() => handleVerify(domain.id)}
                    className="rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink/10"
                  >
                    Verify
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(domain.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${STATUS_BUTTON_CLASS.error}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
