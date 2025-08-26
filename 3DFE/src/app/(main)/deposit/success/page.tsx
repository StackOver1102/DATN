"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { transactionApi } from "@/lib/api";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";
import { useUserProfile } from "@/lib/hooks/useAuth";

function DepositSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  
  // Safely destructure session data and update function
  const sessionData = session?.data;
  const updateSession = session?.update;
  
  // Access token from session data
  // Using a more specific type for the session user
  interface SessionUser {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    token?: string;
  }
  
  const accessToken = (sessionData?.user as SessionUser)?.token;

  // Get the PayPal order ID from the URL query parameters
  const paypalOrderId = searchParams.get("token");
  // Check if the origin is VQR
  const origin = searchParams.get("origin");

  // const fewt
  // Fetch user profile to get the latest balance
  // const {
  //   profile: userProfile,
  //   isLoading: isLoadingProfile,
  //   fetchProfile: refetchProfile,
  // } = useUserProfile();

  useEffect(() => {
    // Prevent running the effect if we don't have the necessary data yet
    if (!paypalOrderId && origin !== "vqr") {
      toast.error("Payment information not found");
      router.push("/deposit");
      return;
    }

    // Helper function to process payment with a token
    const processPaymentWithToken = async (token: string, orderId: string) => {
      try {
        // Call the API to verify and process the payment
        const response = await transactionApi.approvePayPalOrder(
          token,
          orderId
        );

        if (!response.success) {
          throw new Error(response.message || "Payment processing failed");
        }

        // Update session to get the new balance
        if (updateSession) {
          await updateSession();
        }

        // Refetch user profile to get the latest balance
        // if (refetchProfile) {
        //   await refetchProfile();
        // }

        // Set success state
        setIsSuccess(true);

        // Store the new balance for display
        if (
          response.data &&
          typeof response.data === "object" &&
          "balance" in response.data
        ) {
          setNewBalance(response.data.balance as number);
        }
      } catch (error: unknown) {
        console.error("Error in processPaymentWithToken:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    };

    const processPayment = async () => {
      try {
        setIsProcessing(true);
        
        // If origin is VQR, just show success without processing
        if (origin === "vqr") {
          // Refetch user profile to get the latest balance
          // if (refetchProfile) {
          //   await refetchProfile();
          // }
          setIsSuccess(true);
          setIsProcessing(false);
          return;
        }

        // Check if we have a session and token
        if (!sessionData || !accessToken) {
          console.error("No session or access token available");

          // Wait a moment and try to get the session again (in case it's still loading)
          setTimeout(async () => {
            if (updateSession) {
              await updateSession();
            }

            // If we still don't have a session after update, redirect to login
            if (!sessionData || !accessToken) {
              toast.error("Your session has expired. Please log in again");
              router.push(
                "/signin?callbackUrl=" +
                  encodeURIComponent(window.location.href)
              );
              return;
            } else {
              // If we now have a session, proceed with payment processing
              processPaymentWithToken(
                accessToken,
                paypalOrderId as string
              );
            }
          }, 1500);
          return;
        }

        // Process payment with the token
        processPaymentWithToken(accessToken, paypalOrderId as string);
      } catch (error: unknown) {
        console.error("Error processing payment:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred while processing your payment"
        );

        // Redirect to deposit page after a delay
        setTimeout(() => {
          router.push("/deposit");
        }, 3000);
      }
    };

    // Only run the payment process once when the component mounts
    // or when critical dependencies change
    const runOnce = async () => {
      await processPayment();
    };
    
    runOnce();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalOrderId, origin, router]);

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <h2 className="text-2xl font-semibold mt-6 text-gray-800">
              Processing payment...
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we confirm your transaction
            </p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Thank you for your deposit. Coins have been added to your account.
            </p>

            <div className="flex space-x-4">
              <Link href="/models">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Explore Models
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">View Profile</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Payment Processing Failed
            </h1>
            <p className="text-gray-600 text-center mb-6">
              An error occurred while processing your payment. Please try again or
              contact our support team.
            </p>
            <Link href="/deposit">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Try Again
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DepositSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      }
    >
      <DepositSuccessContent />
    </Suspense>
  );
}
