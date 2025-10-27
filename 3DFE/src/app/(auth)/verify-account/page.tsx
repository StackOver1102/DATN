"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyAccount = async () => {
      if (!token) {
        setIsVerifying(false);
        setErrorMessage(
          "Verification token not found. Please check the link in your email."
        );
        return;
      }

      try {
        const response = await authApi.verifyAccount(token);

        if (response.success) {
          setIsSuccess(true);
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push("/signin");
          }, 3000);
        } else {
          setErrorMessage(
            response.message || "Account verification failed. Please try again."
          );
        }
      } catch (error) {
        setErrorMessage(
          "An error occurred during account verification. Please try again later."
        );
        console.error("Verification error:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccount();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Account Verification
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? "Verifying your account..."
              : isSuccess
              ? "Your account has been successfully verified!"
              : "Account verification failed"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center p-6">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center text-gray-600">
                Please wait while we verify your account...
              </p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-gray-600">
                Your account has been successfully verified. You will be
                redirected to the login page in a few seconds.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-red-600">{errorMessage}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {!isVerifying &&
            (isSuccess ? (
              <Button asChild>
                <Link href="/signin">Login Now</Link>
              </Button>
            ) : (
              <div className="flex flex-col space-y-2 w-full">
                <Button asChild variant="outline">
                  <Link href="/signin">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Register New Account</Link>
                </Button>
              </div>
            ))}
        </CardFooter>
      </Card>
    </div>
  );
}
