"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Inbox, Mail, RefreshCw } from "lucide-react";
import { Loading } from "@/components/ui/loading";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Function for resending verification email
  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      // Call the API to resend the verification email
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification email");
      }

      // Reset countdown
      setCountdown(60);
      // Show success message using browser alert (could be replaced with a toast)
      alert("Verification email has been resent. Please check your inbox.");
    } catch (error) {
      // Handle error
      console.error("Failed to resend verification email:", error);
      alert("Failed to resend verification email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{" "}
            <span className="font-medium text-black">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Please check your email and click on the verification link to
            activate your account.
          </p>
          <p className="text-gray-600">
            If you don't see the email in your inbox, please check your spam
            folder.
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center">
              <Inbox className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                The verification link will expire in 24 hours.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={handleResendEmail}
            disabled={countdown > 0 || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : countdown > 0 ? (
              <>Resend email ({countdown}s)</>
            ) : (
              <>Resend verification email</>
            )}
          </Button>

          <div className="flex justify-between w-full">
            <Button asChild variant="ghost" size="sm">
              <Link href="/signin">Back to login</Link>
            </Button>

            <Button asChild variant="ghost" size="sm">
              <Link href="/">Go to homepage</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<Loading variant="spinner" size="lg" fullScreen />}>
      <CheckEmailContent />
    </Suspense>
  );
}
