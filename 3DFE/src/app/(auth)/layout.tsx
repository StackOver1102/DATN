import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <SessionProvider>{children}</SessionProvider>
      <Toaster position="top-right" richColors />
    </div>
  );
}
