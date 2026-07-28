import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://unconventional-framing.local"),
  title: {
    default: "Unconventional Framing",
    template: "%s | Unconventional Framing"
  },
  description:
    "A cinematic research platform for classifying movie frames as conventional or unconventional.",
  openGraph: {
    title: "Unconventional Framing",
    description:
      "A premium film-frame annotation platform for researchers, production teams, and film scholars.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Unconventional Framing",
    description: "Classify, analyze, and export cinematic frame research."
  },
  alternates: {
    canonical: "/"
  }
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

