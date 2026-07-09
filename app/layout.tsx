import type { Metadata } from "next";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/brand";
import { fontVariableClassNames, karla } from "@/lib/fonts";
import ErrorBeacon from "@/components/ErrorBeacon";
import { SupportProvider } from "@/components/SupportContext";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" className={fontVariableClassNames} suppressHydrationWarning>
      <body className={karla.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBeacon />
          <SupportProvider email={SUPPORT_EMAIL} whatsapp={SUPPORT_WHATSAPP}>
            {children}
          </SupportProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
