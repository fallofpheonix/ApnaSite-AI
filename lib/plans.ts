import { prisma } from "./db";

// ─── THE ONE FILE TO EDIT FOR PRICING/LIMITS ────────────────────────────────
// Everything plan-related (price, publish limits, badge) reads from this
// table. Changing ₹199 → ₹299 or 5 sites → 10 is an edit here and nowhere
// else. (Remember Razorpay amounts are in paise: priceInr * 100 is sent.)

export interface Plan {
  key: "free" | "pro";
  name: string;
  priceInr: number; // per month; 0 = free
  maxPublishedSites: number;
  /** Whether published sites carry the "Made with ApnaSite" footer badge. */
  showBadge: boolean;
  /** Bullet points for the /billing page. */
  perks: string[];
}

export const PLANS: Record<Plan["key"], Plan> = {
  free: {
    key: "free",
    name: "Free",
    priceInr: 0,
    maxPublishedSites: 1,
    showBadge: true,
    perks: [
      "1 published site",
      "All themes and editing features",
      'Small "Made with ApnaSite" badge on your site',
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceInr: 199,
    maxPublishedSites: 5,
    showBadge: false,
    perks: ["Up to 5 published sites", "No ApnaSite badge", "Email/WhatsApp support"],
  },
};

/** Subscription statuses that grant the paid plan. "authenticated" is
 * Razorpay's state right after checkout, before the first charge settles. */
export const PAID_STATUSES = new Set(["active", "authenticated"]);

/** Grace period past currentPeriodEnd before a subscription is treated as
 * lapsed regardless of status. Razorpay renews at period end and the status
 * webhook can lag by a day; 3 days covers retries. Past that, a row still
 * marked "active" almost certainly means a webhook we never received (renewal
 * failed, or a cancel/halt notification was dropped) — so we stop honouring it
 * rather than grant paid features forever. */
export const PERIOD_END_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/** The fields of a Subscription row that decide the plan. Kept structural so
 * both a full Prisma row and an in-transaction read satisfy it. */
export interface PlanSubscription {
  status: string;
  planKey: string;
  currentPeriodEnd: Date | null;
}

/** The effective plan for a subscription row (or its absence). The single
 * source of truth for "does this row grant paid features" — every gate resolves
 * through here so the stale-period rule can't be bypassed. Paid only when the
 * status grants it, the planKey is real, AND the period hasn't lapsed past the
 * grace window. Anything else (no row, halted, cancelled, expired, stale) → free. */
export function planFromSubscription(sub: PlanSubscription | null): Plan {
  if (
    sub &&
    PAID_STATUSES.has(sub.status) &&
    PLANS[sub.planKey as Plan["key"]] &&
    !periodLapsed(sub.currentPeriodEnd)
  ) {
    return PLANS[sub.planKey as Plan["key"]];
  }
  return PLANS.free;
}

/** The user's effective plan, read from the database. */
export async function planForUser(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return planFromSubscription(sub);
}

/** True when currentPeriodEnd is more than the grace window in the past. A
 * null period end (never set — e.g. status set before the first charge) is
 * not treated as lapsed; the status alone governs until a period is known. */
function periodLapsed(currentPeriodEnd: Date | null): boolean {
  if (!currentPeriodEnd) return false;
  return currentPeriodEnd.getTime() < Date.now() - PERIOD_END_GRACE_MS;
}
