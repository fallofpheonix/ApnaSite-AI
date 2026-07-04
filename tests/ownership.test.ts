import { describe, expect, it } from "vitest";
import { GET, PUT, DELETE } from "@/app/api/sites/[id]/route";
import { POST as publish } from "@/app/api/sites/[id]/publish/route";
import { POST as unpublish } from "@/app/api/sites/[id]/unpublish/route";
import { jsonReq, makeSite, prisma, routeParams, userWithSession, validData } from "./helpers";

describe("site ownership — user A vs user B's site", () => {
  it("read/update/publish/unpublish/delete all return the same 404", async () => {
    const a = await userWithSession("owner-a");
    const b = await userWithSession("owner-b");
    const site = await makeSite(b.user.id);

    const p = routeParams({ id: site.id });
    const results = await Promise.all([
      GET(jsonReq(`/api/sites/${site.id}`, { method: "GET", cookie: a.cookie }), p),
      PUT(jsonReq(`/api/sites/${site.id}`, { method: "PUT", cookie: a.cookie, body: { data: validData() } }), p),
      publish(jsonReq(`/api/sites/${site.id}/publish`, { cookie: a.cookie }), p),
      unpublish(jsonReq(`/api/sites/${site.id}/unpublish`, { cookie: a.cookie }), p),
      DELETE(jsonReq(`/api/sites/${site.id}`, { method: "DELETE", cookie: a.cookie }), p),
    ]);

    for (const res of results) {
      expect(res).toBeDefined();
      if (!res) throw new Error("Route handler returned no response.");
      expect(res.status).toBe(404);
    }

    // B's site is untouched by all of the above
    const after = await prisma.site.findUnique({ where: { id: site.id } });
    expect(after).not.toBeNull();
    expect(after!.published).toBe(false);
  });

  it("a nonexistent id gets the identical 404 (no existence leak)", async () => {
    const a = await userWithSession("owner-c");
    const res = await GET(
      jsonReq(`/api/sites/nope`, { method: "GET", cookie: a.cookie }),
      routeParams({ id: "nope" })
    );
    expect(res).toBeDefined();
    if (!res) throw new Error("Route handler returned no response.");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Site not found.");
  });
});
