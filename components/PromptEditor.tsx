"use client";

import { useEffect, useRef, useState } from "react";
import type { StorefrontData } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PromptEditor({
  siteId,
  onDataUpdate,
}: {
  siteId: string;
  onDataUpdate: (data: StorefrontData) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, prompt: text }),
      });

      if (!res.ok) throw new Error("Failed to process prompt");
      const result = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message ?? "Done! Your site has been updated." },
      ]);

      if (result.data) {
        onDataUpdate(result.data);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-ink/10 bg-card shadow-sm">
      <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-ink-soft">
            Describe changes you want to make to your site...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "ml-auto bg-teal text-paper"
                : "bg-ink/5 text-ink"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 self-start rounded-xl bg-ink/5 px-4 py-3">
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-ink/10 p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your changes..."
          className="flex-1 rounded-xl border border-ink/10 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-teal/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
