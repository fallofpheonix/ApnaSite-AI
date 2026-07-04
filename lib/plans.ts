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
    perks: ["Up to 5 published sites", "No ApnaSite badge", "Priority support (email)"],
  },
};

/** Subscription statuses that grant the paid plan. "authenticated" is
 * Razorpay's state right after checkout, before the first charge settles. */
const PAID_STATUSES = new Set(["active", "authenticated"]);

/** The user's effective plan: an active Razorpay subscription → that plan,
 * anything else (no row, halted, cancelled, expired) → free. */
export async function planForUser(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub && PAID_STATUSES.has(sub.status) && PLANS[sub.planKey as Plan["key"]]) {
    return PLANS[sub.planKey as Plan["key"]];
  }
  return PLANS.free;
}
