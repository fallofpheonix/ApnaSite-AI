"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import VoiceTextCapture from "@/components/VoiceTextCapture";
import StorefrontPreview from "@/components/StorefrontPreview";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UpgradeSheet from "@/components/UpgradeSheet";
import AppFooter from "@/components/AppFooter";
import { useAuthUser } from "@/components/useAuthUser";
import { ensureProductIds, validStorefront, type Language, type StorefrontData } from "@/lib/types";
import ParticleBackground from "@/components/ParticleBackground";

type Stage = "capture" | "loading" | "preview" | "published";
const RECOVERY_KEY = "apnasite:draft:v1";

export default function Home() {
  const { user, logout } = useAuthUser();
  const [stage, setStage] = useState<Stage>("capture");
  const [data, setData] = useState<StorefrontData | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sampleMode, setSampleMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // Native share sheet on phones (WhatsApp, SMS, ...); copy-link on desktop
  // browsers that don't implement navigator.share.
  const handleShare = async () => {
    if (!publishedUrl || !data) return;
    const url = new URL(publishedUrl, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.shopName, text: `${data.shopName} — ${data.tagline}`, url });
      } catch {
        // user dismissed the share sheet — not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        setError("Couldn't copy automatically — long-press or right-click the link above to copy it.");
      }
    }
  };

  // Opened from the dashboard as /?site=<id> → load that site into the editor.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("site");
    if (!id) {
      queueMicrotask(() => {
        try {
          const recovered = JSON.parse(localStorage.getItem(RECOVERY_KEY) ?? "null") as {
            data?: unknown;
            siteId?: string | null;
            sampleMode?: boolean;
          } | null;
          if (recovered && validStorefront(recovered.data)) {
            setData(ensureProductIds(recovered.data));
            setSiteId(typeof recovered.siteId === "string" ? recovered.siteId : null);
            setSampleMode(Boolean(recovered.sampleMode));
            setStage("preview");
          }
        } catch {
          localStorage.removeItem(RECOVERY_KEY);
        }
      });
      return;
    }
    (async () => {
      const res = await fetch(`/api/sites/${id}`);
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/?site=${id}`)}`;
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Couldn't open that site.");
        return;
      }
      setSiteId(json.site.id);
      setData(ensureProductIds(json.site.data));
      setStage("preview");
    })();
  }, []);

  // Crash/network/navigation recovery for unsaved and in-progress edits.
  useEffect(() => {
    if (!data || (stage !== "preview" && stage !== "published")) return;
    localStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ data, siteId, sampleMode, savedAt: Date.now() })
    );
  }, [data, sampleMode, siteId, stage]);

  const handleGenerate = async (description: string, language: Language) => {
    if (user === null) {
      window.location.href = "/login?next=/";
      return;
    }
    setError(null);
    setProgress(0);
    setProgressMessage("Starting...");
    setStage("loading");

    try {
      // Step 1: Submit job — returns instantly with jobId (no blocking)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, language }),
      });
      const json = await res.json();

      if (res.status === 401) {
        window.location.href = "/login?next=/";
        return;
      }
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate your site.");
      }

      const jobId: string = json.jobId;
      setGenerationJobId(jobId);
      setProgress(5);
      setProgressMessage("Queued for generation...");

      // Step 2: Subscribe to SSE for real-time progress
      const eventSource = new EventSource(`/api/generate/${jobId}`);
      eventSourceRef.current = eventSource;

      let resolved = false;

      eventSource.addEventListener("progress", (e) => {
        try {
          const payload = JSON.parse(e.data);
          setProgress(payload.progress ?? 0);
          setProgressMessage(payload.message ?? "");
        } catch {
          // malformed event — ignore
        }
      });

      eventSource.addEventListener("completed", (e) => {
        if (resolved) return;
        resolved = true;
        eventSource.close();
        eventSourceRef.current = null;
        setGenerationJobId(null);
        try {
          const payload = JSON.parse(e.data);
          setData(ensureProductIds(payload.data));
          setSampleMode(Boolean(payload.sampleMode));
          setSiteId(null);
          setStage("preview");
        } catch {
          setError("Failed to parse generation result.");
          setStage("capture");
        }
      });

      eventSource.addEventListener("failed", (e) => {
        if (resolved) return;
        resolved = true;
        eventSource.close();
        eventSourceRef.current = null;
        setGenerationJobId(null);
        try {
          const payload = JSON.parse(e.data);
          setError(payload.error || "Generation failed.");
        } catch {
          setError("Generation failed.");
        }
        setStage("capture");
      });

      eventSource.addEventListener("heartbeat", () => {
        // keep-alive — no action needed
      });

      eventSource.onerror = () => {
        if (resolved) return;
        resolved = true;
        eventSource.close();
        eventSourceRef.current = null;
        setError("Lost connection to the server. Please try again.");
        setStage("capture");
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("capture");
    }
  };

  const cancelGeneration = async () => {
    if (!generationJobId) return;
    await fetch(`/api/generate/${generationJobId}`, { method: "DELETE" });
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setGenerationJobId(null);
    setError("Generation cancelled.");
    setStage("capture");
  };

  /** Creates the site on first save, updates it afterwards. Returns the site
   * id so publish can chain off an unsaved site in one click. */
  const saveSite = async (): Promise<string | null> => {
    if (!data) return null;
    const res = siteId
      ? await fetch(`/api/sites/${siteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        })
      : await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
    if (res.status === 401) {
      window.location.href = "/login?next=/";
      return null;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to save your site.");
    const id = siteId ?? json.site.id;
    setSiteId(id);
    return id;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveSite();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const id = await saveSite();
      if (!id) return;
      const res = await fetch(`/api/sites/${id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "publish_limit_reached") {
          setUpgradeMessage(json.error);
          return;
        }
        throw new Error(json.error || "Failed to publish your site.");
      }
      setPublishedUrl(json.url);
      setStage("published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  };

  const startOver = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setData(null);
    setSiteId(null);
    setPublishedUrl(null);
    setError(null);
    setSampleMode(false);
    setProgress(0);
    setProgressMessage("");
    setStage("capture");
    localStorage.removeItem(RECOVERY_KEY);
    window.history.replaceState(null, "", "/");
  };

  return (
    <main className="min-h-screen bg-paper relative">
      <ParticleBackground />
      <AppHeader user={user} onLogout={logout} />

      {stage === "capture" || stage === "loading" ? (
        <div className="bg-jali flex min-h-[calc(100vh-57px)] flex-col items-center justify-center gap-8 px-6 py-16">
          <div className="stage-enter text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              Websites for small shops
            </p>
            <h1 className="mt-3 font-display text-5xl italic text-ink sm:text-6xl">ApnaSite AI</h1>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
              Describe your business. We build, design, and publish your website in minutes.
            </p>
            {user === null && (
              <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
                You&apos;ll be asked to log in (just an email code) before generating.
              </p>
            )}
          </div>

          {error && (
            <div className="w-full max-w-xl rounded-xl border border-brick/20 bg-brick/10 px-5 py-3 text-sm text-brick">
              {error}
            </div>
          )}

          {stage === "loading" && (
            <div className="w-full max-w-xl">
              <div className="rounded-2xl border border-ink/10 bg-card p-8 shadow-sm">
                <div className="text-center">
                  <div className="mb-4 text-3xl">✨</div>
                  <p className="text-sm font-medium text-ink">{progressMessage || "Working..."}</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/5">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-ink-soft">{progress}%</p>
                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="mx-auto mt-4 block min-h-[44px] rounded-xl border border-ink/15 px-5 py-2 text-sm font-medium text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === "capture" && (
            <div className="stage-enter" style={{ animationDelay: "0.08s" }}>
              <VoiceTextCapture onSubmit={handleGenerate} loading={false} />
            </div>
          )}
        </div>
      ) : null}

      {(stage === "preview" || stage === "published") && data && (
        <div className="stage-enter mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
            <div>
              <h2 className="font-display text-xl text-ink">
                {stage === "published" ? "Your site is live!" : "Here's your website"}
              </h2>
              {stage === "published" && publishedUrl ? (
                <p className="text-sm text-ink-soft">
                  Anyone can visit it at{" "}
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener"
                    className="font-semibold text-teal underline hover:text-teal-deep"
                  >
                    {publishedUrl}
                  </a>{" "}
                  — share the link with your customers.
                </p>
              ) : (
                <p className="text-sm text-ink-soft">
                  Click any text below to edit it before publishing.
                </p>
              )}
            </div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <button
                onClick={startOver}
                className="min-h-[44px] rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5"
              >
                Start Over
              </button>
              {stage === "published" && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex min-h-[44px] items-center rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
                  >
                    My Sites
                  </Link>
                  <button
                    onClick={handleShare}
                    className="min-h-[44px] flex-1 rounded-xl bg-teal px-6 py-2 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-teal-deep sm:flex-none"
                  >
                    {shareCopied ? "Link copied ✓" : "Share your site"}
                  </button>
                </>
              )}
              {stage === "preview" && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || publishing}
                    className="min-h-[44px] flex-1 rounded-xl border border-teal/40 px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal/10 disabled:opacity-50 sm:flex-none"
                  >
                    {saving ? "Saving..." : savedFlash ? "Saved ✓" : "Save draft"}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing || saving}
                    className="min-h-[44px] flex-1 rounded-xl bg-marigold px-6 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-marigold-deep hover:text-paper disabled:opacity-50 sm:flex-none"
                  >
                    {publishing ? "Publishing..." : "Publish"}
                  </button>
                </>
              )}
            </div>
          </div>

          {sampleMode && stage === "preview" && (
            <div className="rounded-xl border border-marigold/40 bg-marigold-soft/50 px-5 py-3 text-sm text-ink">
              <strong>Sample content.</strong> No Anthropic API key is configured, so this is
              hand-written placeholder content — your description wasn&apos;t actually processed. The
              full flow (edit, save, publish) still works; add the key to .env.local for real
              generation.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-brick/20 bg-brick/10 px-5 py-3 text-sm text-brick">
              {error}
            </div>
          )}

          {stage === "preview" && <ThemeSwitcher data={data} onChange={setData} />}

          <StorefrontPreview data={data} onChange={setData} />
        </div>
      )}

      <AppFooter />

      <UpgradeSheet
        open={upgradeMessage !== null}
        message={upgradeMessage ?? ""}
        onClose={() => setUpgradeMessage(null)}
      />
    </main>
  );
}
