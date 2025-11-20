import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { StoreInitializer } from "@/components/StoreInitializer";
import ReduxProvider from "@/components/providers/ReduxProvider";
import Script from "next/script";
import * as gtag from '@/lib/gtag';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "3dvn.org",
  description: "3Dvn.org - Your 3D Model Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ReduxProvider>
          <SessionProvider>
            <ReactQueryProvider>
              <StoreInitializer />
              {children}
            </ReactQueryProvider>
          </SessionProvider>
        </ReduxProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
