import { NextResponse } from "next/server";
import { sampleStorefront } from "@/lib/sampleData";

// GET /api/demo — returns sample storefront data without requiring login or
// an API key. Used by the "Try Demo" button on the home page.

export async function GET() {
  const data = sampleStorefront(
    "Sharma General Store - kirana and daily groceries shop, open 9am to 9pm, home delivery available",
    "hinglish",
  );
  return NextResponse.json({ data, sampleMode: true });
}
