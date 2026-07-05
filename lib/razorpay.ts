import { createHmac, timingSafeEqual } from "crypto";
import { PLANS } from "./plans";

// Razorpay integration — TEST MODE. Talks to the REST API directly with
// fetch + basic auth (no SDK dependency; the official `razorpay` npm package
// would slot in here 1:1 if preferred). Docs: https://razorpay.com/docs/api/
//
// Required env (test keys from the Razorpay dashboard → Settings → API Keys):
//   RAZORPAY_KEY_ID        rzp_test_...
//   RAZORPAY_KEY_SECRET    ...
//   RAZORPAY_WEBHOOK_SECRET  the secret you type when creating the webhook
//                            in the dashboard (Settings → Webhooks)
// Without keys the app renders plans with checkout disabled — it never fakes
// a payment.

const API_BASE = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function rzp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.description || `Razorpay API error (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

// ── Plan ────────────────────────────────────────────────────────────────────
// Razorpay subscriptions bill against a Plan object on their side. We find or
// create one matching lib/plans.ts (tagged via notes) so nothing has to be
// clicked together in the dashboard. Cached per process.

let cachedPlanId: string | null = null;

interface RzpPlan {
  id: string;
  notes?: Record<string, string>;
  item: { amount: number; currency: string };
}

export async function ensureProPlanId(): Promise<string> {
  if (cachedPlanId) return cachedPlanId;

  const pro = PLANS.pro;
  const wanted = { apnasite_plan: pro.key, apnasite_price_inr: String(pro.priceInr) };

  const existing = await rzp<{ items: RzpPlan[] }>("/plans?count=100");
  const match = existing.items.find(
    (p) =>
      p.notes?.apnasite_plan === wanted.apnasite_plan &&
      p.notes?.apnasite_price_inr === wanted.apnasite_price_inr
  );
  if (match) {
    cachedPlanId = match.id;
    return match.id;
  }

  const created = await rzp<RzpPlan>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: `ApnaSite ${pro.name}`,
        amount: pro.priceInr * 100, // paise
        currency: "INR",
        description: `ApnaSite ${pro.name} — up to ${pro.maxPublishedSites} published sites`,
      },
      notes: wanted,
    }),
  });
  cachedPlanId = created.id;
  return created.id;
}

// ── Subscription ────────────────────────────────────────────────────────────

export interface RzpSubscription {
  id: string;
  status: string;
  current_end: number | null; // unix seconds
}

/** Current subscription state straight from Razorpay — used to double-check
 * before (re)activating locally. */
export async function getSubscription(subscriptionId: string): Promise<RzpSubscription> {
  return rzp<RzpSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function createSubscription(userId: string): Promise<RzpSubscription> {
  const planId = await ensureProPlanId();
  return rzp<RzpSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: 60, // Razorpay requires a cap; 60 monthly cycles = 5 years
      customer_notify: 0,
      notes: { apnasite_user_id: userId },
    }),
  });
}

// ── Signature checks ────────────────────────────────────────────────────────

function safeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/** Checkout callback signature: HMAC-SHA256(payment_id + "|" + subscription_id)
 * with the key secret. Confirms the browser-reported success really came from
 * Razorpay and not a hand-crafted request. */
export function verifyCheckoutSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256 of the raw request body with the webhook
 * secret (a separate secret configured when registering the webhook). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
