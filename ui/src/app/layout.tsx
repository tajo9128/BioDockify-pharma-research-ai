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
  title: "BioDockify v2.0.0 - Pharma Research AI",
  description: "Open-source Desktop AI platform for pharmaceutical research automation",
  keywords: ["BioDockify", "Pharma Research", "AI", "Drug Discovery", "PhD Research", "Neo4j", "Literature Review"],
  authors: [{ name: "BioDockify Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BioDockify - Pharma Research AI",
    description: "Automate pharmaceutical research with AI-powered literature analysis and drug discovery",
    type: "website",
  },
}

import dynamic from 'next/dynamic';

const TitleBar = dynamic(() => import('@/components/TitleBar'), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground pt-10`}
      >
        <TitleBar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

