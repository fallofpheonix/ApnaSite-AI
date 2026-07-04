import { createHmac, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as webhook } from "@/app/api/billing/webhook/route";
import { prisma, userWithSession } from "./helpers";

const SECRET = "whsec_test_suite"; // must match vitest.config env

function signedRequest(body: string, opts: { signature?: string; eventId?: string } = {}) {
  const signature = opts.signature ?? createHmac("sha256", SECRET).update(body).digest("hex");
  return new NextRequest("http://test.local/api/billing/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
      ...(opts.eventId ? { "x-razorpay-event-id": opts.eventId } : {}),
    },
    body,
  });
}

function eventBody(event: string, subId: string) {
  return JSON.stringify({
    entity: "event",
    event,
    payload: { subscription: { entity: { id: subId, status: event.split(".")[1], current_end: null } } },
  });
}

async function seedSub(prefix: string) {
  const { user } = await userWithSession(prefix);
  const subId = `sub_${prefix}_${randomBytes(4).toString("hex")}`;
  await prisma.subscription.create({
    data: { userId: user.id, planKey: "pro", razorpaySubscriptionId: subId, status: "created" },
  });
  return subId;
}

describe("billing webhook", () => {
  it("applies a correctly signed event", async () => {
    const subId = await seedSub("wh-ok");
    const res = await webhook(signedRequest(eventBody("subscription.activated", subId)));
    expect(res.status).toBe(200);
    const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subId } });
    expect(sub!.status).toBe("active");
  });

  it("rejects an invalid signature and writes nothing", async () => {
    const subId = await seedSub("wh-bad");
    const res = await webhook(
      signedRequest(eventBody("subscription.activated", subId), { signature: "ab".repeat(32) })
    );
    expect(res.status).toBe(401);
    const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subId } });
    expect(sub!.status).toBe("created");
  });

  it("rejects a body tampered after signing", async () => {
    const subId = await seedSub("wh-tamper");
    const body = eventBody("subscription.activated", subId);
    const goodSig = createHmac("sha256", SECRET).update(body).digest("hex");
    const res = await webhook(signedRequest(body + " ", { signature: goodSig }));
    expect(res.status).toBe(401);
  });

  it("processes a replayed event id exactly once", async () => {
    const subId = await seedSub("wh-replay");
    const eventId = `evt_${randomBytes(6).toString("hex")}`;

    const first = await webhook(
      signedRequest(eventBody("subscription.activated", subId), { eventId })
    );
    expect(first.status).toBe(200);
    expect((await first.json()).matched).toBe(1);

    // Replay with the SAME event id but a different (still signed) payload —
    // it must be acknowledged without being applied.
    const replay = await webhook(
      signedRequest(eventBody("subscription.halted", subId), { eventId })
    );
    expect(replay.status).toBe(200);
    expect((await replay.json()).duplicate).toBe(true);

    const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: subId } });
    expect(sub!.status).toBe("active"); // halted replay was not applied
  });

  it("acknowledges but ignores untracked event types", async () => {
    const subId = await seedSub("wh-ignore");
    const res = await webhook(signedRequest(eventBody("payment.captured", subId)));
    expect(res.status).toBe(200);
    expect((await res.json()).ignored).toBe("payment.captured");
  });
});
