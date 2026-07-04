"use client";

import { useCallback, useEffect, useState } from "react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import PageHeader from "@/components/PageHeader";
import { useAuthUser } from "@/components/useAuthUser";

interface PlanInfo {
  key: string;
  name: string;
  priceInr: number;
  maxPublishedSites: number;
  perks: string[];
}

interface BillingInfo {
  plans: Record<string, PlanInfo>;
  currentPlan: string;
  publishedCount: number;
  checkoutEnabled: boolean;
  subscription: { status: string; planKey: string; currentPeriodEnd: string | null } | null;
}

// Razorpay's Checkout script attaches a constructor to window.
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const { user, logout } = useAuthUser();
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing");
    if (res.status === 401) {
      window.location.href = "/login?next=/billing";
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Couldn't load billing info.");
      return;
    }
    setInfo(json);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await loadCheckoutScript();
      if (!ok || !window.Razorpay) throw new Error("Couldn't load the payment window.");

      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't start the payment.");

      const rzp = new window.Razorpay({
        key: json.keyId,
        subscription_id: json.subscriptionId,
        name: "ApnaSite AI",
        description: "ApnaSite Pro — monthly",
        theme: { color: "#1e5c58" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyJson.error || "Payment verification failed.");
          }
          await load();
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const plans = info ? Object.values(info.plans) : [];

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <div className="mx-auto max-w-3xl px-4 py-12">
        <PageHeader
          title="Plans & Billing"
          subtitle="Simple pricing for small shops. Cancel anytime."
        />

        {error && (
          <div className="mt-4 rounded-xl border border-brick/20 bg-brick/10 px-5 py-3 text-sm text-brick">
            {error}
          </div>
        )}

        {info && !info.checkoutEnabled && (
          <div className="mt-4 rounded-xl border border-marigold/40 bg-marigold-soft/50 px-5 py-3 text-sm text-ink">
            <strong>Payments not configured.</strong> Checkout is disabled because Razorpay test
            keys aren&apos;t set. Add <code>RAZORPAY_KEY_ID</code> and{" "}
            <code>RAZORPAY_KEY_SECRET</code> to <code>.env.local</code> to try the upgrade flow.
          </div>
        )}

        {info === null ? (
          <p className="py-12 text-center text-ink-soft">Loading...</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = info.currentPlan === plan.key;
              const isPro = plan.key === "pro";
              return (
                <div
                  key={plan.key}
                  className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${
                    isCurrent ? "border-teal ring-2 ring-teal/20" : "border-ink/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
                    {isCurrent ? (
                      <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
                        Your plan
                      </span>
                    ) : isPro ? (
                      <span className="rounded-full bg-marigold-soft px-3 py-1 text-xs font-semibold text-ink">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {plan.priceInr === 0 ? "₹0" : `₹${plan.priceInr}`}
                    <span className="text-sm font-normal text-ink-soft">/month</span>
                  </p>
                  <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-soft">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <span className="text-teal" aria-hidden>
                          ✓
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {isPro && !isCurrent && (
                      <button
                        type="button"
                        onClick={upgrade}
                        disabled={busy || !info.checkoutEnabled}
                        className="min-h-[48px] w-full rounded-xl bg-marigold px-6 font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {info.checkoutEnabled
                          ? busy
                            ? "Opening checkout..."
                            : "Upgrade to Pro"
                          : "Checkout disabled (no test keys)"}
                      </button>
                    )}
                    {isCurrent && (
                      <p className="text-center text-xs text-ink-soft">
                        {info.publishedCount} of {plan.maxPublishedSites} published site
                        {plan.maxPublishedSites > 1 ? "s" : ""} used
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {info?.subscription && (
          <div className="mt-6 rounded-2xl border border-ink/10 bg-card p-5 text-sm text-ink-soft shadow-sm">
            <h3 className="mb-1 font-semibold text-ink">Subscription</h3>
            <p>
              Status: <span className="font-medium text-ink">{info.subscription.status}</span>
              {info.subscription.currentPeriodEnd && (
                <>
                  {" · "}
                  {["active", "authenticated"].includes(info.subscription.status)
                    ? "renews"
                    : "current period ends"}{" "}
                  {new Date(info.subscription.currentPeriodEnd).toLocaleDateString()}
                </>
              )}
            </p>
            <p className="mt-1 text-xs">
              Test mode — no real money moves. Payments are processed by Razorpay; we never see
              your card details.
            </p>
          </div>
        )}

      </div>

      <AppFooter />
    </main>
  );
}
