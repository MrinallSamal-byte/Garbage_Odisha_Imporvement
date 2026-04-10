import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobilePrimaryCta } from "@/components/layout/mobile-primary-cta";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { env } from "@/lib/env";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

function getMetadataBase() {
  try {
    return new URL(env.NEXT_PUBLIC_APP_URL);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Delhi Garbage Watch",
    template: "%s | Delhi Garbage Watch",
  },
  description:
    "Delhi-wide civic garbage reporting with GPS capture, public map/list views, and GIS-based civic authority, ward, MLA, and MP mapping.",
  applicationName: "Delhi Garbage Watch",
  manifest: "/manifest.webmanifest",
  keywords: [
    "Delhi civic reporting",
    "garbage complaint Delhi",
    "Delhi ward map",
    "MLA lookup Delhi",
    "MP lookup Delhi",
  ],
  openGraph: {
    title: "Delhi Garbage Watch",
    description:
      "Photograph roadside garbage in Delhi, map it to the correct civic authority and elected representatives, and track public cleanup progress.",
    siteName: "Delhi Garbage Watch",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Delhi Garbage Watch",
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg?v=2",
  },
};

export const viewport: Viewport = {
  themeColor: "#16324f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} bg-transparent font-sans antialiased`}
      >
        <ServiceWorkerRegister />
        <div className="relative flex min-h-screen flex-col pb-24 md:pb-0">
          <div className="absolute inset-0 -z-10 bg-civic-grid bg-grid-sm opacity-50" />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <MobilePrimaryCta />
        </div>
      </body>
    </html>
  );
}
