"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function CancelContent() {
  const router = useRouter();
  // const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();

  // Get the PayPal token from the URL query parameters
  // const paypalToken = searchParams.get("token");

  useEffect(() => {

    // Check if we have a session
    if (!session) {
      // Wait a moment and try to get the session again (in case it's still loading)
      const timer = setTimeout(async () => {
        await updateSession();

        // If we still don't have a session after update, redirect to login
        if (!session) {
          toast.error("Your session has expired. Please log in again");
          router.push("/signin?callbackUrl=" + encodeURIComponent("/deposit"));
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Show a toast notification about the cancelled payment
    toast.info("Payment has been canceled");
  }, [session, router, updateSession]);

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Canceled
          </h1>
          <p className="text-gray-600 text-center mb-6">
            You have canceled the payment transaction. No fees have been charged.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-full mb-8">
            <h3 className="font-medium text-gray-800 mb-2">Note:</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>No fees are charged for canceled transactions</li>
              <li>You can try depositing again at any time</li>
              <li>
                If you encounter payment issues, please contact our support team
              </li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <Link href="/deposit">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DepositCancelPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
