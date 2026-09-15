import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/demo/demo-banner";
import { auth } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo/mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PB Wisdom",
  description: "Badminton club companion for PB Wisdom Medan",
  applicationName: "PB Wisdom",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PB Wisdom",
  },
};

export const viewport: Viewport = {
  themeColor: "#2eb6ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const demo = isDemoMode();
  const session = demo ? await auth() : null;
  const demoRole =
    session?.user?.role === "ADMIN" ? ("ADMIN" as const) : ("MEMBER" as const);

  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session} demo={demo}>
          {demo && <DemoBanner role={demoRole} />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
