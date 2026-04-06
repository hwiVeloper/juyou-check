import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import AdBanner from "@/components/AdBanner";
import ThemeProvider from "@/components/ThemeProvider";
import { AdProvider } from "@/contexts/AdContext";
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
  title: "주유췤 — 전국 주유소 실시간 유가 비교",
  description:
    "내 주변 가장 저렴한 주유소를 찾아보세요. 전국 휘발유·경유·LPG 실시간 가격 비교 서비스",
  openGraph: {
    title: "주유췤 — 전국 주유소 실시간 유가 비교",
    description: "내 주변 가장 저렴한 주유소를 찾아보세요.",
    siteName: "주유췤",
    locale: "ko_KR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "주유췤",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AdProvider>
            {children}
            {process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT && (
              <AdBanner
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT}
                adFormat="horizontal"
                fullWidthResponsive={true}
                className="fixed bottom-14 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
              />
            )}
            <BottomNav />
          </AdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
