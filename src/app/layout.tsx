import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#3B82F6',
}

export const metadata: Metadata = {
  title:           "BA",
  applicationName: "BA",
  description:     "Plateforme de préparation au Baccalauréat",
  appleWebApp: {
    capable:        true,
    title:          'BA',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/apple-icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Hard fallback for iOS Safari — do not remove */}
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-title" content="BA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="BA" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
