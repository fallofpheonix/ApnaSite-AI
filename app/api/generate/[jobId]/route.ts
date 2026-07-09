import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { cancelJob, getJob, subscribe, type JobEvent } from "@/lib/queue";
import { makeJobEventSSE } from "@/lib/generationSse";

/**
 * SSE endpoint for streaming generation progress.
 *
 * GET /api/generate/[jobId]
 *
 * Events:
 *   - progress:  { progress: number, message: string }
 *   - completed: { data: StorefrontData, sampleMode: boolean }
 *   - failed:    { error: string }
 *   - heartbeat: (keepalive every 15s)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    typeof job.input !== "object" ||
    job.input === null ||
    !("userId" in job.input) ||
    job.input.userId !== user.id
  ) {
    // Match the not-found response so job IDs cannot be probed across users.
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If the job already completed or failed, return the result immediately
  if (job.status === "completed") {
    return new Response(
      makeSSE("completed", job.output),
      {
        headers: sseHeaders(),
      }
    );
  }
  if (job.status === "failed") {
    return new Response(
      makeSSE("failed", { error: job.error }),
      {
        headers: sseHeaders(),
      }
    );
  }

  // Stream live progress via SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send the current state once before subscribing to future updates.
      if (job.progress > 0) {
        controller.enqueue(
          encoder.encode(
            makeSSE("progress", { progress: job.progress, message: job.progressMessage })
          )
        );
      }

      // Subscribe to future updates
      const unsubscribe = subscribe(jobId, (event: JobEvent) => {
        try {
          controller.enqueue(encoder.encode(makeJobEventSSE(event)));
          if (event.type === "completed" || event.type === "failed") {
            clearInterval(heartbeat);
            unsubscribe();
            controller.close();
          }
        } catch {
          // Stream already closed
          unsubscribe();
        }
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(makeSSE("heartbeat", {})));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { jobId } = await params;
  const job = getJob(jobId);
  if (
    !job ||
    typeof job.input !== "object" ||
    job.input === null ||
    !("userId" in job.input) ||
    job.input.userId !== user.id
  ) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  if (!cancelJob(jobId)) {
    return Response.json({ error: "Job is already finished." }, { status: 409 });
  }
  return Response.json({ cancelled: true });
}

function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // nginx: disable buffering
  };
}

function makeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
