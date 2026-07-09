import type { JobEvent } from "./queue";

function makeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function makeJobEventSSE(event: JobEvent): string {
  switch (event.type) {
    case "completed":
      return makeSSE("completed", event.data);
    case "failed":
      return makeSSE("failed", { error: event.error });
    case "progress":
      return makeSSE("progress", {
        progress: event.progress,
        message: event.message,
      });
    case "heartbeat":
      return makeSSE("heartbeat", {});
  }
}
