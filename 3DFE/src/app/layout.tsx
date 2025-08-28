import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { StoreInitializer } from "@/components/StoreInitializer";
import ReduxProvider from "@/components/providers/ReduxProvider";

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
