import { describe, expect, it } from "vitest";
import { POST as generate } from "@/app/api/generate/route";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/types";
import { jsonReq, userWithSession } from "./helpers";

// No ANTHROPIC_API_KEY in the test env, so an accepted description returns
// hand-authored sample data — no network, no token spend.

describe("generate input limits", () => {
  it("accepts a normal description (sample mode)", async () => {
    const { cookie } = await userWithSession("gen-ok");
    const res = await generate(
      jsonReq("/api/generate", {
        cookie,
        body: { description: "Sharma General Store in Bhopal, open 9 to 9", language: "en" },
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).sampleMode).toBe(true);
  });

  it("rejects a description over the length cap before doing any work", async () => {
    const { cookie } = await userWithSession("gen-cap");
    // Plenty of words (clears the min-word check) but over the char cap.
    const description = "word ".repeat(MAX_DESCRIPTION_LENGTH / 5 + 1);
    const res = await generate(
      jsonReq("/api/generate", { cookie, body: { description, language: "en" } })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/too long/);
  });
});
