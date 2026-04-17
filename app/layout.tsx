import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

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
  userScalable: false,
  // Android Chrome, Samsung Internet 주소창 색상
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
    { media: "(prefers-color-scheme: light)", color: "#0f0f0f" },
  ],
};

export const metadata: Metadata = {
  title: "AutoAttend — 스마트 출퇴근 관리",
  description: "온라인 출퇴근 관리 시스템",
  // iOS Safari 홈 화면 추가
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AutoAttend",
  },
  // iOS가 전화번호/이메일 자동 링크 변환 방지
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  // Android Chrome 홈 화면 추가 (PWA 없이도 동작)
  applicationName: "AutoAttend",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0f0f0f] overscroll-none">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-TBPZ85KGZ1" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TBPZ85KGZ1');
        `}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
