import { describe, expect, it } from "vitest";
import { POST as createSite } from "@/app/api/sites/route";
import { jsonReq, userWithSession, validData } from "./helpers";

async function post(cookie: string, data: unknown) {
  return createSite(jsonReq("/api/sites", { cookie, body: { data } }));
}

describe("storefront data validation on save", () => {
  it("accepts a well-formed payload", async () => {
    const { cookie } = await userWithSession("val-ok");
    expect((await post(cookie, validData())).status).toBe(201);
  });

  it("rejects an oversized shopName", async () => {
    const { cookie } = await userWithSession("val-name");
    const res = await post(cookie, validData({ shopName: "x".repeat(201) }));
    expect(res.status).toBe(400);
  });

  it("rejects an oversized aboutText", async () => {
    const { cookie } = await userWithSession("val-about");
    const res = await post(cookie, validData({ aboutText: "x".repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it("rejects too many products", async () => {
    const { cookie } = await userWithSession("val-count");
    const products = Array.from({ length: 41 }, (_, i) => ({
      name: `P${i}`,
      description: "d",
      price: null,
    }));
    expect((await post(cookie, validData({ products }))).status).toBe(400);
  });

  it("rejects image paths outside /uploads/", async () => {
    const { cookie } = await userWithSession("val-img");
    for (const image of [
      "https://evil.example/x.png",
      "javascript:alert(1)",
      "/uploads/../../etc/passwd",
      "/uploads/evil.js",
    ]) {
      const res = await post(
        cookie,
        validData({ products: [{ name: "P", description: "d", price: null, image }] })
      );
      expect(res.status, `image: ${image}`).toBe(400);
    }
  });

  it("accepts a server-shaped upload path", async () => {
    const { cookie } = await userWithSession("val-img-ok");
    const res = await post(
      cookie,
      validData({
        products: [{ name: "P", description: "d", price: null, image: "/uploads/1712345678-a1b2c3d4e5f6.png" }],
      })
    );
    expect(res.status).toBe(201);
  });

  it("rejects an unknown language", async () => {
    const { cookie } = await userWithSession("val-lang");
    const res = await post(cookie, validData({ language: "fr" as never }));
    expect(res.status).toBe(400);
  });
});
