"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { StorefrontData } from "@/lib/types";

interface TemplatePickerProps {
  onSelect: (data: StorefrontData) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Start with a template
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink">Choose a starting point</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Pick a template and customise it, or describe your business from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelected(template.id === selected ? null : template.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected === template.id
                ? "border-teal bg-teal/5 shadow-md"
                : "border-ink/10 bg-card hover:border-ink/20 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">{template.name}</h3>
                <p className="mt-0.5 text-xs text-ink-soft">{template.category}</p>
              </div>
              {template.pro && (
                <span className="rounded-full bg-marigold/20 px-2 py-0.5 text-xs font-semibold text-marigold">
                  Pro
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-soft">{template.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {template.data.products.slice(0, 3).map((p) => (
                <span
                  key={p.name}
                  className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              const template = TEMPLATES.find((t) => t.id === selected);
              if (template) onSelect(structuredClone(template.data));
            }}
            className="min-h-[44px] rounded-xl bg-teal px-8 py-3 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-teal-deep"
          >
            Use This Template
          </button>
        </div>
      )}
    </div>
  );
}
