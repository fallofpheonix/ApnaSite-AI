"use client";

import { useState } from "react";

type Step = "email" | "code";

// Where to send the user after login. Read from ?next=... at submit time;
// only same-site paths are allowed so the parameter can't redirect elsewhere.
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't send a code.");
      setInfo(json.message);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "That code didn't work.");
      window.location.href = nextPath();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <main className="bg-jali flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16">
      <div className="stage-enter w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="font-display text-4xl italic text-ink">
            VoxSite AI
          </a>
          <p className="mt-2 text-ink-soft">
            {step === "email"
              ? "Enter your email and we'll send you a login code. No password needed."
              : `We sent a 6-digit code for ${email.trim()}.`}
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-brick/20 bg-brick/10 px-4 py-2.5 text-sm text-brick">
              {error}
            </div>
          )}
          {info && step === "code" && (
            <div className="mb-4 rounded-xl border border-teal/20 bg-teal/10 px-4 py-2.5 text-sm text-teal">
              {info}
            </div>
          )}

          {step === "email" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestCode();
              }}
              className="flex flex-col gap-4"
            >
              <label className="text-sm font-medium text-ink" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-ink/10 bg-paper px-4 py-3 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="rounded-xl bg-teal py-3 font-semibold text-paper transition-colors hover:bg-teal-deep disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send login code"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verifyCode();
              }}
              className="flex flex-col gap-4"
            >
              <label className="text-sm font-medium text-ink" htmlFor="code">
                6-digit code
              </label>
              <input
                id="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="rounded-xl border border-ink/10 bg-paper px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="rounded-xl bg-teal py-3 font-semibold text-paper transition-colors hover:bg-teal-deep disabled:opacity-50"
              >
                {busy ? "Checking..." : "Log in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setInfo(null);
                  setError(null);
                }}
                className="text-sm text-ink-soft hover:text-ink"
              >
                Use a different email or resend the code
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
