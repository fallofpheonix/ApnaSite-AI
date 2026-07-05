import { createHmac, randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as verify } from "@/app/api/billing/verify/route";
import { POST as subscribe } from "@/app/api/billing/subscribe/route";
import { jsonReq, prisma, userWithSession } from "./helpers";

// Stubbed per-test with vi.stubEnv. For verify tests only the SECRET is set:
// signature checks work, but razorpayConfigured() stays false (needs KEY_ID
// too), so the route never attempts a live Razorpay lookup.
const KEY_SECRET = "key_secret_test_suite";

function checkoutSignature(paymentId: string, subId: string) {
  return createHmac("sha256", KEY_SECRET).update(`${paymentId}|${subId}`).digest("hex");
}

async function seedSub(prefix: string, status: string) {
  const session = await userWithSession(prefix);
  const subId = `sub_${prefix}_${randomBytes(4).toString("hex")}`;
  await prisma.subscription.create({
    data: { userId: session.user.id, planKey: "pro", razorpaySubscriptionId: subId, status },
  });
  return { ...session, subId };
}

/** A correctly signed checkout-success callback, as the browser would send. */
function verifyReq(cookie: string, subId: string) {
  const paymentId = `pay_${randomBytes(6).toString("hex")}`;
  return jsonReq("/api/billing/verify", {
    cookie,
    body: {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subId,
      razorpay_signature: checkoutSignature(paymentId, subId),
    },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkout verify replay protection", () => {
  it("a valid signature activates a pending subscription", async () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", KEY_SECRET);
    const { cookie, subId } = await seedSub("ver-ok", "created");

    const res = await verify(verifyReq(cookie, subId));
    expect(res.status).toBe(200);
    const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subId } });
    expect(sub!.status).toBe("active");
  });

  it.each(["cancelled", "expired", "completed"])(
    "a replayed success callback cannot revive a %s subscription",
    async (status) => {
      vi.stubEnv("RAZORPAY_KEY_SECRET", KEY_SECRET);
      const { cookie, subId } = await seedSub(`ver-${status}`, status);

      const res = await verify(verifyReq(cookie, subId));
      expect(res.status).toBe(409);
      const sub = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId: subId },
      });
      expect(sub!.status).toBe(status); // unchanged — not reactivated
    }
  );
});

describe("subscribe idempotency", () => {
  it("reopening checkout resumes the pending subscription instead of minting a new one", async () => {
    // Both keys set → checkout "configured". The route must return the
    // existing created subscription without calling Razorpay at all (a real
    // API call here would fail and surface as a 502).
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_suite");
    vi.stubEnv("RAZORPAY_KEY_SECRET", KEY_SECRET);
    const { cookie, subId } = await seedSub("sub-idem", "created");

    for (let i = 0; i < 2; i++) {
      const res = await subscribe(jsonReq("/api/billing/subscribe", { cookie }));
      expect(res.status).toBe(200);
      expect((await res.json()).subscriptionId).toBe(subId);
    }
    const count = await prisma.subscription.count({
      where: { razorpaySubscriptionId: subId },
    });
    expect(count).toBe(1);
  });
});
