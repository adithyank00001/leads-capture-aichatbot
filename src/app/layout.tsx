import type { Metadata } from "next";
import Script from "next/script";
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
import { FB_PIXEL_ID } from "@/lib/fbpixel";
import { getMetaPixelBootstrapScript } from "@/lib/meta/pixel-bootstrap-script";

const appOrigin = publicConfig.appUrl.replace(/\/+$/, "");

// App/dashboard body font. preload disabled so store pages (Fraunces + Manrope)
// are not competing with a third font for first-load bandwidth.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`${appOrigin}/`),
  title: publicConfig.appName,
  description: publicConfig.productTagline,
};

const metaPixelBootstrapScript = getMetaPixelBootstrapScript();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {metaPixelBootstrapScript ? (
          <Script
            id="meta-pixel-bootstrap"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: metaPixelBootstrapScript }}
          />
        ) : null}
        {/* GTM disabled for now
        <GoogleTagManager />
        <GoogleTagManagerNoscript />
        */}
        {FB_PIXEL_ID ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(FB_PIXEL_ID)}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        {children}
        <Toaster richColors position="top-center" />
        <MetaPixel />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
