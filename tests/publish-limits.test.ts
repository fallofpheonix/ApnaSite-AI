import { describe, expect, it } from "vitest";
import { POST as publish } from "@/app/api/sites/[id]/publish/route";
import { jsonReq, makeSite, prisma, routeParams, userWithSession } from "./helpers";

describe("publish limits", () => {
  it("free user's 2nd publish returns 402 with the structured code", async () => {
    const { user, cookie } = await userWithSession("limit-free");
    await makeSite(user.id, { published: true, slug: `live-${user.id.slice(-6)}` });
    const draft = await makeSite(user.id);

    const res = await publish(
      jsonReq(`/api/sites/${draft.id}/publish`, { cookie }),
      routeParams({ id: draft.id })
    );
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.code).toBe("publish_limit_reached");
    expect(json.plan).toBe("free");

    const after = await prisma.site.findUnique({ where: { id: draft.id } });
    expect(after!.published).toBe(false);
  });

  it("re-publishing an already-live site is allowed and keeps its slug", async () => {
    const { user, cookie } = await userWithSession("limit-repub");
    const slug = `keeper-${user.id.slice(-6)}`;
    const live = await makeSite(user.id, { published: true, slug });

    const res = await publish(
      jsonReq(`/api/sites/${live.id}/publish`, { cookie }),
      routeParams({ id: live.id })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe(slug);
  });

  it("an active pro subscription raises the limit", async () => {
    const { user, cookie } = await userWithSession("limit-pro");
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planKey: "pro",
        razorpaySubscriptionId: `sub_test_${user.id.slice(-8)}`,
        status: "active",
      },
    });
    await makeSite(user.id, { published: true, slug: `pro1-${user.id.slice(-6)}` });
    const draft = await makeSite(user.id);

    const res = await publish(
      jsonReq(`/api/sites/${draft.id}/publish`, { cookie }),
      routeParams({ id: draft.id })
    );
    expect(res.status).toBe(200);
  });
});
