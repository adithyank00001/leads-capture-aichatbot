import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// GTM disabled for now
// import {
//   GoogleTagManager,
//   GoogleTagManagerNoscript,
// } from "@/components/marketing/google-tag-manager";
import { MetaPixel } from "@/components/meta-pixel";
import { MicrosoftClarity } from "@/components/microsoft-clarity";
import { Toaster } from "@/components/ui/sonner";
import { publicConfig } from "@/lib/config";

const appOrigin = publicConfig.appUrl.replace(/\/+$/, "");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`${appOrigin}/`),
  title: publicConfig.appName,
  description: publicConfig.productTagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* GTM disabled for now
        <GoogleTagManager />
        <GoogleTagManagerNoscript />
        */}
        {children}
        <Toaster richColors position="top-center" />
        <MetaPixel />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
