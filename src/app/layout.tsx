import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import ClientNavbar from "@/components/ClientNavbar";
import ClientLayout from "@/components/ClientLayout";

const workSans = Work_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Buy↓Sell↑Hold",
  description: "Track your favorite stocks in real-time",
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Buy↓Sell↑Hold',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#ffffff',
    'format-detection': 'telephone=no',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
                document.body.classList.add('ios-standalone');
              }
            `,
          }}
        />
      </head>
      <body className={workSans.className}>
        <Providers>
          <WatchlistProvider>
            <ClientNavbar />
            <ClientLayout>
              <main>
                {children}
              </main>
            </ClientLayout>
          </WatchlistProvider>
        </Providers>
      </body>
    </html>
  );
}
