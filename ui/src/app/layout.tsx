import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BioDockify AI - Pharmaceutical Research Platform",
  description: "Zero-Cost AI Platform for Drug Discovery and Pharmaceutical Research. Literature analysis, entity extraction, and knowledge graph building.",
  keywords: ["BioDockify", "Pharmaceutical", "Drug Discovery", "AI Research", "Knowledge Graph", "Entity Extraction"],
  authors: [{ name: "BioDockify Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BioDockify AI",
    description: "Zero-Cost Pharmaceutical Research Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

