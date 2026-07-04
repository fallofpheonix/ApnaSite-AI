import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import pkg from "@/package.json";

// GET /api/health — for uptime pingers and deploy smoke checks. 200 when the
// database answers, 503 when it doesn't. Never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, version: pkg.version, db: "up" });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(
      { ok: false, version: pkg.version, db: "down" },
      { status: 503 }
    );
  }
}
