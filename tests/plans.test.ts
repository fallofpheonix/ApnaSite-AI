import { describe, expect, it } from "vitest";
import { planForUser, PERIOD_END_GRACE_MS } from "@/lib/plans";
import { prisma, userWithSession } from "./helpers";

// planForUser is the single gate on paid features. Beyond "active status →
// pro", it must fail closed when a paid-status row goes stale: if
// currentPeriodEnd is well past and no renewal/cancel webhook ever moved the
// status, the row is honoured no longer — otherwise a dropped webhook would
// grant Pro forever.

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function subscribe(
  emailPrefix: string,
  fields: { status: string; currentPeriodEnd?: Date | null }
) {
  const { user } = await userWithSession(emailPrefix);
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planKey: "pro",
      razorpaySubscriptionId: `sub_${user.id.slice(-10)}`,
      status: fields.status,
      currentPeriodEnd: fields.currentPeriodEnd ?? null,
    },
  });
  return user;
}

describe("planForUser", () => {
  it("no subscription row → free", async () => {
    const { user } = await userWithSession("plan-none");
    expect((await planForUser(user.id)).key).toBe("free");
  });

  it("active status with a future period end → pro", async () => {
    const user = await subscribe("plan-active", {
      status: "active",
      currentPeriodEnd: daysFromNow(20),
    });
    expect((await planForUser(user.id)).key).toBe("pro");
  });

  it("active status with a null period end → pro (period not yet known)", async () => {
    const user = await subscribe("plan-active-null", {
      status: "active",
      currentPeriodEnd: null,
    });
    expect((await planForUser(user.id)).key).toBe("pro");
  });

  it("active status still within the 3-day grace after period end → pro", async () => {
    const user = await subscribe("plan-grace", {
      status: "active",
      // Ended a day ago — inside the grace window, renewal webhook may lag.
      currentPeriodEnd: daysFromNow(-1),
    });
    expect((await planForUser(user.id)).key).toBe("pro");
  });

  it("active status whose period ended more than 3 days ago → free (stale row)", async () => {
    const user = await subscribe("plan-stale", {
      status: "active",
      currentPeriodEnd: new Date(Date.now() - PERIOD_END_GRACE_MS - 60_000),
    });
    expect((await planForUser(user.id)).key).toBe("free");
  });

  it("cancelled status → free regardless of period end", async () => {
    const user = await subscribe("plan-cancelled", {
      status: "cancelled",
      currentPeriodEnd: daysFromNow(20),
    });
    expect((await planForUser(user.id)).key).toBe("free");
  });
});
