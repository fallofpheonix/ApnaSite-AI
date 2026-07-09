import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { MAX_DESCRIPTION_LENGTH, type Language } from "@/lib/types";
import { enqueueGenerate } from "@/lib/worker";
import { queueSize } from "@/lib/queue";

const MIN_WORD_COUNT = 4;
const VALID_LANGUAGES: Language[] = ["en", "hi", "hinglish"];
const MAX_QUEUE_SIZE = 50;

export async function POST(req: NextRequest) {
  // Generation costs real money per call, so it's session-gated...
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Please log in to generate a site." }, { status: 401 });
  }

  // ...and rate-limited per user AND per IP
  const byUser = rateLimit(`generate:user:${user.id}`, 10, 5 * 60 * 1000);
  const byIp = rateLimit(`generate:ip:${clientIp(req)}`, 20, 5 * 60 * 1000);
  if (!byUser.ok || !byIp.ok) {
    const retry = Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds);
    return NextResponse.json(
      { error: `You're generating too fast. Try again in about ${retry} seconds.` },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  // Don't accept more jobs if the queue is backed up
  if (queueSize() >= MAX_QUEUE_SIZE) {
    return NextResponse.json(
      { error: "The AI is busy right now. Please try again in a moment." },
      { status: 503 }
    );
  }

  let description: string;
  let language: Language;
  try {
    const body = await req.json();
    description = typeof body?.description === "string" ? body.description.trim() : "";
    language = VALID_LANGUAGES.includes(body?.language) ? body.language : "hinglish";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json(
      { error: "Please describe your business first." },
      { status: 400 }
    );
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        error: `That description is too long (over ${MAX_DESCRIPTION_LENGTH} characters). Trim it to the essentials — name, what you sell, hours, contact.`,
      },
      { status: 400 }
    );
  }

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORD_COUNT) {
    return NextResponse.json(
      {
        error:
          "That description is too short to work with. Add a bit more - your shop name, what you sell, and your hours - then try again.",
      },
      { status: 400 }
    );
  }

  // Push job to queue — returns instantly, no AI call blocks this request
  const job = enqueueGenerate({ description, language, userId: user.id });

  // Return the job ID immediately. The client subscribes via SSE for progress.
  return NextResponse.json(
    { jobId: job.id },
    {
      status: 202, // Accepted — processing in background
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
