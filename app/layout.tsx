import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://safaodisha.local"),
  title: {
    default: "SafaOdisha",
    template: "%s | SafaOdisha",
  },
  description:
    "Odisha's civic cleanliness reporting platform with GPS-based constituency mapping, representative lookup, and public accountability workflows.",
  applicationName: "SafaOdisha",
  keywords: [
    "Odisha civic reporting",
    "garbage complaint Odisha",
    "MLA lookup Odisha",
    "MP lookup Odisha",
    "public cleanliness dashboard",
  ],
  openGraph: {
    title: "SafaOdisha",
    description:
      "Capture live civic cleanliness issues in Odisha, geolocate them, and route public accountability to the correct representatives.",
    siteName: "SafaOdisha",
    type: "website",
  },
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
        <div className="relative flex min-h-screen flex-col">
          <div className="absolute inset-0 -z-10 bg-civic-grid bg-grid-sm opacity-50" />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
