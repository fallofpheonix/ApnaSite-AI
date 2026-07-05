"use client";

import { createContext, useContext } from "react";
import { whatsappUrl } from "@/lib/brand";

// Carries the SUPPORT_EMAIL / SUPPORT_WHATSAPP env values (server-only) into
// client components. The root layout renders the provider; while neither var
// is set, every consumer renders nothing.

export interface SupportContact {
  email: string | null;
  whatsapp: string | null;
}

const SupportContext = createContext<SupportContact>({ email: null, whatsapp: null });

export function SupportProvider({
  email,
  whatsapp,
  children,
}: SupportContact & { children: React.ReactNode }) {
  return <SupportContext.Provider value={{ email, whatsapp }}>{children}</SupportContext.Provider>;
}

export function useSupport(): SupportContact {
  return useContext(SupportContext);
}

/** "Need help?" trailer for error banners — a contact, not a shrug. Renders
 * nothing until a support contact is configured. */
export function SupportNote() {
  const { email, whatsapp } = useSupport();
  if (!email && !whatsapp) return null;
  return (
    <p className="mt-2">
      Need help?{" "}
      {email && (
        <a href={`mailto:${email}`} className="font-medium underline">
          {email}
        </a>
      )}
      {email && whatsapp && " or "}
      {whatsapp && (
        <a
          href={whatsappUrl(whatsapp)}
          className="font-medium underline"
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp us
        </a>
      )}
      {" — tell us what happened and we'll sort it out."}
    </p>
  );
}
