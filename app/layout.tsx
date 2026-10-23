import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "CHA ADDA — Full-Stack Dating & Matchmaking Platform",
  description:
    "Discover real connections, swipe, match, and chat in real-time. Safe, modern, and verified adult dating platform.",
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
