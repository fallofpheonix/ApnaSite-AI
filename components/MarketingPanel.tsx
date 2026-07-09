"use client";

import { useState } from "react";

type ContentType = "ad_copy" | "email_campaign" | "social_post";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "social_post", label: "Social Post" },
];

const AD_PLATFORMS = ["Google", "Facebook", "Instagram"];
const EMAIL_GOALS = ["Welcome", "Promotion", "Announcement"];
const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "Twitter"];

export default function MarketingPanel({ siteId }: { siteId: string }) {
  const [selectedType, setSelectedType] = useState<ContentType>("ad_copy");
  const [platform, setPlatform] = useState(AD_PLATFORMS[0]);
  const [goal, setGoal] = useState(EMAIL_GOALS[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setContent("");
    try {
      const payload: Record<string, string> = { siteId, type: selectedType };
      if (selectedType === "ad_copy" || selectedType === "social_post") {
        payload.platform = platform;
      } else {
        payload.goal = goal;
      }

      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Generation failed");
      const result = await res.json();
      setContent(result.content ?? "");
    } catch {
      setContent("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Could not copy content.");
    }
  }

  const options =
    selectedType === "email_campaign"
      ? EMAIL_GOALS
      : selectedType === "ad_copy"
        ? AD_PLATFORMS
        : SOCIAL_PLATFORMS;

  return (
    <div className="space-y-5 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Content Type</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => {
                setSelectedType(ct.value);
                setPlatform(ct.value === "social_post" ? SOCIAL_PLATFORMS[0] : AD_PLATFORMS[0]);
                setGoal(EMAIL_GOALS[0]);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedType === ct.value
                  ? "bg-teal text-paper"
                  : "bg-ink/5 text-ink hover:bg-ink/10"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">
          {selectedType === "email_campaign" ? "Goal" : "Platform"}
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (selectedType === "email_campaign") {
                  setGoal(opt);
                } else {
                  setPlatform(opt);
                }
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                (selectedType === "email_campaign" ? goal : platform) === opt
                  ? "bg-ink text-paper"
                  : "bg-ink/5 text-ink hover:bg-ink/10"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="min-h-[44px] rounded-xl bg-marigold px-6 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Content"}
      </button>

      {content && (
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-ink-soft">Generated Content</p>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg bg-ink/10 px-3 py-1 text-xs font-medium text-ink transition-colors hover:bg-ink/20"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{content}</p>
          {copyError && <p className="mt-2 text-xs text-brick">{copyError}</p>}
        </div>
      )}
    </div>
  );
}
