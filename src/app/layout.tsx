import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Sentienx — Deriv Trading Platform",
  description:
    "Trade Deriv markets with a powerful, custom trading interface. Automated bots, trading academy, and bankroll management — all in one platform.",
  keywords: [
    "deriv",
    "trading",
    "binary options",
    "multipliers",
    "automated trading",
    "trading bots",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sentienx",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Sentienx — Deriv Trading Platform",
    description:
      "Trade Deriv markets with a powerful, custom trading interface.",
    siteName: "Sentienx",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentienx — Deriv Trading Platform",
    description:
      "Trade Deriv markets with a powerful, custom trading interface.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6366f1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sentienx",
              url: "https://sentienx.omixsystems.store/",
              description:
                "Deriv trading platform with automated bots and live charts.",
              publisher: {
                "@type": "Organization",
                name: "Omix Systems",
                url: "https://omixsystems.store/",
              },
              applicationCategory: "FinanceApplication",
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-sentienx-bg text-sentienx-text antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
