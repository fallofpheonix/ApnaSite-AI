"use client";

import { useSupport } from "./SupportContext";
import { whatsappUrl } from "@/lib/brand";

// Quiet page closing (docs/DESIGN-REFERENCES.md §A rule 4): every full page
// ends with this, never on a raw widget.
export default function AppFooter() {
  const { email, whatsapp } = useSupport();
  return (
    <footer className="mt-16 border-t border-ink/10 px-6 py-8 text-center text-xs text-ink-soft">
      <p>ApnaSite AI — websites for small shops, in your own words.</p>
      {(email || whatsapp) && (
        <p className="mt-2">
          Need help?{" "}
          {email && (
            <a href={`mailto:${email}`} className="underline hover:text-ink">
              {email}
            </a>
          )}
          {email && whatsapp && " · "}
          {whatsapp && (
            <a
              href={whatsappUrl(whatsapp)}
              className="underline hover:text-ink"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}
        </p>
      )}
      <p className="mt-2">
        <a href="/terms" className="underline hover:text-ink">
          Terms
        </a>
        {" · "}
        <a href="/privacy" className="underline hover:text-ink">
          Privacy
        </a>
      </p>
    </footer>
  );
}
