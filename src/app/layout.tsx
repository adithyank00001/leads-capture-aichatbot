import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { MetaPixelHead } from "@/components/marketing/meta-pixel-head";
import { MetaPixelPageView } from "@/components/marketing/meta-pixel";
import { Toaster } from "@/components/ui/sonner";
import { publicConfig } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: publicConfig.appName,
  description: publicConfig.productTagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <MetaPixelHead />
      </head>
      <body className="min-h-full flex flex-col">
        <MetaPixelPageView />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
