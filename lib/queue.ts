/**
 * In-memory job queue for async AI generation.
 *
 * In production with multiple instances, swap this for Redis (Upstash/BullMQ).
 * The interface is designed so the swap is a single-file change.
 */

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface Job<TInput = unknown, TOutput = unknown> {
  id: string;
  status: JobStatus;
  input: TInput;
  output: TOutput | null;
  error: string | null;
  progress: number; // 0-100
  progressMessage: string;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  /** Server-Sent Events subscribers for this job */
  listeners: Set<(event: JobEvent) => void>;
  abortController: AbortController;
}

export interface JobEvent {
  type: "progress" | "completed" | "failed" | "heartbeat";
  progress?: number;
  message?: string;
  data?: unknown;
  error?: string;
}

// ── Singleton job store ──────────────────────────────────────────────────────

const jobs = new Map<string, Job>();
const MAX_JOBS = 10_000;
const JOB_TTL_MS = 10 * 60 * 1000; // 10 minutes

function randomId(): string {
  const arr = new Uint8Array(12);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanup() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.completedAt && now - job.completedAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }

  if (jobs.size < MAX_JOBS) return;

  // Bound memory even during a burst: discard the oldest terminal jobs first.
  const terminalJobs = [...jobs.entries()]
    .filter(([, job]) => ["completed", "failed", "cancelled"].includes(job.status))
    .sort(([, a], [, b]) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  for (const [id] of terminalJobs) {
    if (jobs.size < MAX_JOBS) break;
    jobs.delete(id);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function createJob<TInput>(input: TInput): Job<TInput> {
  cleanup();
  const id = randomId();
  const job: Job<TInput> = {
    id,
    status: "queued",
    input,
    output: null,
    error: null,
    progress: 0,
    progressMessage: "Queued...",
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    listeners: new Set(),
    abortController: new AbortController(),
  };
  jobs.set(id, job);
  return job;
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job || job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return false;
  }
  job.abortController.abort();
  updateJob(id, {
    status: "cancelled",
    error: "Generation cancelled.",
    progressMessage: "Cancelled",
    completedAt: Date.now(),
  });
  emit(job, { type: "failed", error: "Generation cancelled." });
  return true;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(
  id: string,
  updates: Partial<Pick<Job, "status" | "output" | "error" | "progress" | "progressMessage" | "startedAt" | "completedAt">>
): void {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates);

  // Notify all SSE listeners
  if (updates.progress !== undefined || updates.progressMessage !== undefined) {
    emit(job, {
      type: "progress",
      progress: job.progress,
      message: job.progressMessage,
    });
  }
  if (updates.status === "completed") {
    emit(job, { type: "completed", data: job.output });
  }
  if (updates.status === "failed") {
    emit(job, { type: "failed", error: job.error ?? "Unknown error" });
  }
}

export function emit(job: Job, event: JobEvent): void {
  for (const listener of job.listeners) {
    try {
      listener(event);
    } catch {
      // Listener threw — remove it
      job.listeners.delete(listener);
    }
  }
}

export function subscribe(
  jobId: string,
  listener: (event: JobEvent) => void
): () => void {
  const job = jobs.get(jobId);
  if (!job) {
    // Job already completed/removed — fire immediately
    listener({ type: "failed", error: "Job not found" });
    return () => {};
  }
  job.listeners.add(listener);
  return () => {
    job.listeners.delete(listener);
  };
}

/**
 * Poll the queue and return the next queued job, or null.
 * The caller is responsible for processing it.
 */
export function dequeue<TInput = unknown, TOutput = unknown>(): Job<TInput, TOutput> | null {
  for (const job of jobs.values()) {
    if (job.status === "queued") {
      return job as Job<TInput, TOutput>;
    }
  }
  return null;
}

export function queueSize(): number {
  let count = 0;
  for (const job of jobs.values()) {
    if (job.status === "queued" || job.status === "processing") count++;
  }
  return count;
}
