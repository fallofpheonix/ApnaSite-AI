import { describe, expect, it } from "vitest";
import { makeJobEventSSE } from "../lib/generationSse";
import { cancelJob, createJob, subscribe, updateJob } from "../lib/queue";

describe("generation queue events", () => {
  it("serializes live completion with the same payload shape as completed jobs", () => {
    const output = {
      data: { shopName: "Test Shop" },
      sampleMode: true,
    };

    expect(
      makeJobEventSSE({ type: "completed", data: output })
    ).toBe(`event: completed\ndata: ${JSON.stringify(output)}\n\n`);
  });

  it("emits a completed job output without an extra data wrapper", () => {
    const job = createJob({ userId: "user-1" });
    const output = { data: { shopName: "Test Shop" }, sampleMode: true };
    let received: unknown;
    const unsubscribe = subscribe(job.id, (event) => {
      if (event.type === "completed") received = event.data;
    });

    updateJob(job.id, {
      status: "completed",
      output,
      completedAt: Date.now(),
    });
    unsubscribe();

    expect(received).toEqual(output);
  });

  it("cancels a pending job deterministically", () => {
    const job = createJob({ userId: "user-1" });
    expect(cancelJob(job.id)).toBe(true);
    expect(job.status).toBe("cancelled");
    expect(job.abortController.signal.aborted).toBe(true);
    expect(cancelJob(job.id)).toBe(false);
  });
});
