import type { Metadata } from "next";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/brand";
import { fontVariableClassNames, karla } from "@/lib/fonts";
import ErrorBeacon from "@/components/ErrorBeacon";
import { SupportProvider } from "@/components/SupportContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApnaSite AI",
  description: "Describe your business. We build your website.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariableClassNames}>
      <body className={karla.className}>
        <ErrorBeacon />
        <SupportProvider email={SUPPORT_EMAIL} whatsapp={SUPPORT_WHATSAPP}>
          {children}
        </SupportProvider>
      </body>
    </html>
  );
}
