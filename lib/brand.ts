// Support contact for the whole app, read from the environment. Both are
// optional: while unset, every "contact us" surface renders nothing (or keeps
// its placeholder), so the app ships safely before the address exists and
// lights up the moment the env vars are set.
//
// Client components can't read these (they aren't NEXT_PUBLIC_*): the root
// layout passes them into <SupportProvider>, and client code reads them via
// useSupport() from components/SupportContext.tsx.

/** Support inbox, e.g. "help@apnasite.in". */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || null;

/** Support WhatsApp number with country code, e.g. "+91 98765 43210". */
export const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || null;

/** wa.me link for a number that may contain +, spaces, or dashes. */
export function whatsappUrl(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}
