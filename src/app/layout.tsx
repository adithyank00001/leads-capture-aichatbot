import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  GoogleTagManager,
  GoogleTagManagerNoscript,
} from "@/components/marketing/google-tag-manager";
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
        <GoogleTagManager />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleTagManagerNoscript />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
