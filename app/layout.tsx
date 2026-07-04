import type { Metadata } from "next";
import { fontVariableClassNames, karla } from "@/lib/fonts";
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
      <body className={karla.className}>{children}</body>
    </html>
  );
}
