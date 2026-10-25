import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { DevBanner } from "@/components/layout/dev-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0c1b" },
    { media: "(prefers-color-scheme: light)", color: "#fff5f7" },
  ],
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cha-adda-meet-swap.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform",
    template: "%s | CHA ADDA",
  },
  description:
    "Discover real connections nearby, swipe, match, and chat in real-time. Safe, modern, and verified 18+ adult dating and matchmaking platform.",
  keywords: [
    "dating platform",
    "matchmaking",
    "cha adda",
    "adult dating 18+",
    "real time chat",
    "meet singles",
    "bangladesh dating",
    "verified relationships",
  ],
  authors: [{ name: "CHA ADDA Team" }],
  creator: "CHA ADDA",
  publisher: "CHA ADDA",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "CHA ADDA",
    title: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform",
    description: "Spark real connections over authentic dates. Swipe, match, and chat safely in real-time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform",
    description: "Discover real connections nearby. Safe, verified, real-time dating platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col bg-background text-foreground transition-colors`}
      >
        <ThemeProvider>
          <AuthProvider>
            <DevBanner />
            <Suspense fallback={<header className="h-16 border-b border-border/40 bg-background/80" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
