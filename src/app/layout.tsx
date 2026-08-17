import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// GTM disabled for now
// import {
//   GoogleTagManager,
//   GoogleTagManagerNoscript,
// } from "@/components/marketing/google-tag-manager";
import { MetaPixel } from "@/components/meta-pixel";
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
      <body className="min-h-full flex flex-col">
        {/* GTM disabled for now
        <GoogleTagManager />
        <GoogleTagManagerNoscript />
        */}
        {children}
        <Toaster richColors position="top-center" />
        <MetaPixel />
      </body>
    </html>
  );
}
