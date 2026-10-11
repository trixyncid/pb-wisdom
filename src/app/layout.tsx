import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/demo/demo-banner";
import { auth } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo/mode";
import "./globals.css";

// UI text: Plus Jakarta Sans (made in Jakarta). Headlines and numbers:
// Bricolage Grotesque, bold and sporty to sit next to the logo.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
  themeColor: "#0e2c3c",
  width: "device-width",
  initialScale: 1,
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
        className={`${jakarta.variable} ${bricolage.variable} antialiased`}
      >
        <Providers demo={demo}>
          {demo && <DemoBanner role={demoRole} />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
