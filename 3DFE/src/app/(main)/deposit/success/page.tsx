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

  // Fetch user profile to get the latest balance
  const {
    profile: userProfile,
    isLoading: isLoadingProfile,
    fetchProfile: refetchProfile,
  } = useUserProfile();

  useEffect(() => {
    const processPayment = async () => {
      try {
        setIsProcessing(true);

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
              toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại");
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
            : "Có lỗi xảy ra khi xử lý thanh toán"
        );

        // Redirect to deposit page after a delay
        setTimeout(() => {
          router.push("/deposit");
        }, 3000);
      }
    };

    // Helper function to process payment with a token
    const processPaymentWithToken = async (token: string, orderId: string) => {
      try {
        // Call the API to verify and process the payment
        const response = await transactionApi.approvePayPalOrder(
          token,
          orderId
        );

        if (!response.success) {
          throw new Error(response.message || "Xử lý thanh toán thất bại");
        }

        // Update session to get the new balance
        await updateSession();

        // Refetch user profile to get the latest balance
        await refetchProfile();

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

    if (!paypalOrderId) {
      toast.error("Không tìm thấy thông tin thanh toán");
      router.push("/deposit");
      return;
    }

    processPayment();
  }, [paypalOrderId, sessionData, accessToken, router, updateSession, refetchProfile]);

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <h2 className="text-2xl font-semibold mt-6 text-gray-800">
              Đang xử lý thanh toán...
            </h2>
            <p className="text-gray-600 mt-2">
              Vui lòng đợi trong khi chúng tôi xác nhận giao dịch của bạn
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
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Cảm ơn bạn đã nạp tiền. Kim cương đã được thêm vào tài khoản của
              bạn.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center justify-center w-full mb-8">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-800 mr-2">
                  Số dư hiện tại:
                </span>
                {isLoadingProfile ? (
                  <span className="inline-block w-24 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <span className="text-3xl font-bold text-yellow-600 flex items-center">
                    {newBalance !== null
                      ? newBalance.toLocaleString()
                      : userProfile?.balance?.toLocaleString() || 0}
                    <Image
                      src="/icons/diamond.svg"
                      alt="Diamond"
                      width={28}
                      height={28}
                      className="ml-2"
                    />
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <Link href="/models">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Khám phá mô hình
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Xem hồ sơ</Button>
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
              Xử lý thanh toán thất bại
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Đã xảy ra lỗi khi xử lý thanh toán của bạn. Vui lòng thử lại hoặc
              liên hệ với bộ phận hỗ trợ.
            </p>
            <Link href="/deposit">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Thử lại
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
