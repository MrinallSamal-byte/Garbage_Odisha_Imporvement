import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";

import { FirstVisitWelcome } from "@/components/civic/first-visit-welcome";
import { SiteHeader } from "@/components/layout/site-header";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { env } from "@/lib/env";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
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
    default: "Namma Odia",
    template: "%s | Namma Odia",
  },
  description:
    "Bhubaneswar civic garbage reporting with GPS capture, public map/list views, and GIS-based BMC ward, MLA, and MP mapping.",
  applicationName: "Namma Odia",
  manifest: "/manifest.webmanifest",
  keywords: [
    "Bhubaneswar civic reporting",
    "garbage complaint Bhubaneswar",
    "BMC ward map",
    "MLA lookup Bhubaneswar",
    "MP lookup Bhubaneswar",
  ],
  openGraph: {
    title: "Namma Odia",
    description:
      "Photograph roadside garbage in Bhubaneswar, map it to the correct BMC ward and elected representatives, and track public cleanup progress.",
    siteName: "Namma Odia",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Namma Odia",
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
        className={`${dmSans.variable} ${dmMono.variable} bg-white font-sans antialiased`}
      >
        <ServiceWorkerRegister />
        <div className="relative flex min-h-screen flex-col bg-white">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
        <FirstVisitWelcome />
      </body>
    </html>
  );
}
