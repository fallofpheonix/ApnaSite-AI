/**
 * Background worker that processes generation jobs from the queue.
 *
 * Runs as a polling loop in the same Node.js process. For multi-instance
 * deployments, swap lib/queue.ts for Redis and use BullMQ's built-in workers.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseShopDescription, AIGenerationError } from "./anthropic";
import { sampleStorefront } from "./sampleData";
import { createJob, dequeue, updateJob, type Job } from "./queue";
import type { Language, StorefrontData } from "./types";

export interface GenerateJobInput {
  description: string;
  language: Language;
  userId: string;
}

export interface GenerateJobOutput {
  data: StorefrontData;
  sampleMode: boolean;
}

const POLL_INTERVAL_MS = 200;
const CONCURRENCY = 3; // max parallel AI calls
let activeWorkers = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function hasLiveApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key !== "your-api-key-here");
}

async function processJob(job: Job<GenerateJobInput, GenerateJobOutput>): Promise<void> {
  activeWorkers++;
  updateJob(job.id, {
    status: "processing",
    startedAt: Date.now(),
    progress: 5,
    progressMessage: "Starting generation...",
  });

  try {
    const { description, language } = job.input;

    // No API key → instant sample data
    if (!hasLiveApiKey()) {
      updateJob(job.id, { progress: 50, progressMessage: "Loading sample content..." });
      const data = sampleStorefront(description, language);
      updateJob(job.id, {
        status: "completed",
        output: { data, sampleMode: true },
        progress: 100,
        progressMessage: "Done!",
        completedAt: Date.now(),
      });
      return;
    }

    // Real AI generation with progress callbacks
    const data = await parseShopDescription(description, language, (progress, message) => {
      updateJob(job.id, { progress, progressMessage: message });
    }, job.abortController.signal);

    if (job.status === "cancelled") return;

    updateJob(job.id, {
      status: "completed",
      output: { data, sampleMode: false },
      progress: 100,
      progressMessage: "Done!",
      completedAt: Date.now(),
    });
  } catch (err) {
    if (job.status === "cancelled" || job.abortController.signal.aborted) return;
    let errorMessage = "Something went wrong generating your site. Please try again.";

    if (err instanceof AIGenerationError) {
      errorMessage = err.message;
    } else if (err instanceof Anthropic.AuthenticationError) {
      console.error("Generate worker auth failure:", err);
      errorMessage =
        "The server's Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.local.";
    } else if (err instanceof Anthropic.RateLimitError) {
      errorMessage = "Too many requests right now. Please wait a moment and try again.";
    } else {
      console.error("Generate worker failed:", err);
    }

    updateJob(job.id, {
      status: "failed",
      error: errorMessage,
      progress: 0,
      progressMessage: "Failed",
      completedAt: Date.now(),
    });
  } finally {
    activeWorkers--;
  }
}

function poll(): void {
  while (activeWorkers < CONCURRENCY) {
    const job = dequeue<GenerateJobInput, GenerateJobOutput>();
    if (!job) break;
    // Fire and forget — errors are caught inside processJob
    processJob(job);
  }
}

/**
 * Start the background worker. Safe to call multiple times (idempotent).
 * In production, this runs once when the server starts.
 */
export function startWorker(): void {
  if (pollTimer) return;
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  // Don't keep the process alive just for the worker
  if (pollTimer && typeof pollTimer === "object" && "unref" in pollTimer) {
    pollTimer.unref();
  }
  console.log("[worker] Generation worker started (concurrency: %d)", CONCURRENCY);
}

/**
 * Enqueue a generation job. Returns the job ID for SSE subscription.
 */
export function enqueueGenerate(input: GenerateJobInput): Job<GenerateJobInput> {
  startWorker(); // ensure worker is running
  return createJob(input);
}
