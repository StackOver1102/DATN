"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { transactionApi } from "@/lib/api";
import { toast } from "sonner";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useAppDispatch } from "@/lib/store/hooks";
import { fetchUserProfile } from "@/lib/store/userSlice";

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: Record<string, unknown>) => void;
  onError: (err: Error | unknown) => void;
  currency?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export default function PayPalButton({
  amount,
  onSuccess,
  onError,
  currency = "USD",
  description = "Deposit to account",
  returnUrl,
  cancelUrl,
}: PayPalButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const [, setPaypalOrderId] = useState<string | null>(null);
  const [, setApproveUrl] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return <div>PayPal configuration missing</div>;
  }

  const initialOptions = {
    clientId: clientId,
    currency: currency,
    intent: "capture",
  };

  // Don't render if amount is 0 or negative
  if (amount <= 0) {
    return (
      <div className="w-full py-4 px-6 bg-gray-100 border border-gray-300 rounded-lg text-center text-gray-500">
        Please select a package or enter an amount to pay
      </div>
    );
  }

  // Get the base URL for return and cancel URLs
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:3000";
  };

  // Create PayPal order through our backend
  const createPayPalOrder = async () => {
    if (!session?.accessToken) {
      toast.error("Please log in to continue");

      // Try to refresh the session
      try {
        await updateSession();

        // If still no session after update, redirect to login
        if (!session?.accessToken) {
          if (typeof window !== "undefined") {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(
              window.location.href
            )}`;
          }
          return null;
        }
      } catch (error) {
        console.error("Error updating session:", error);
        if (typeof window !== "undefined") {
          window.location.href = `/signin?callbackUrl=${encodeURIComponent(
            window.location.href
          )}`;
        }
        return null;
      }
    }

    try {
      setIsPending(true);

      // Set default return and cancel URLs if not provided
      const baseUrl = getBaseUrl();
      const defaultReturnUrl = `${baseUrl}/deposit/success`;
      const defaultCancelUrl = `${baseUrl}/deposit/cancel`;

      const response = await transactionApi.createPayPalOrder(
        session.accessToken,
        {
          amount: amount,
          currency: currency,
          description: description,
          returnUrl: returnUrl || defaultReturnUrl,
          cancelUrl: cancelUrl || defaultCancelUrl,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create PayPal order");
      }

      setPaypalOrderId(response.data.paypalOrderId);
      setApproveUrl(response.data.approveUrl);

      return response.data.paypalOrderId;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      toast.error("Cannot create PayPal order. Please try again later.");
      onError(error);
      setIsPending(false);
      return null;
    }
  };

  // Process the approved PayPal order through our backend
  const processApprovedOrder = async (orderId: string) => {
    if (!session?.accessToken) {
      toast.error("Please log in to continue");

      // Try to refresh the session
      try {
        await updateSession();

        // If still no session after update, redirect to login
        if (!session?.accessToken) {
          if (typeof window !== "undefined") {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(
              window.location.href
            )}`;
          }
          return false;
        }
      } catch (error) {
        console.error("Error updating session:", error);
        if (typeof window !== "undefined") {
          window.location.href = `/signin?callbackUrl=${encodeURIComponent(
            window.location.href
          )}`;
        }
        return false;
      }
    }

    try {
      // Call our backend to verify and process the payment
      const response = await transactionApi.approvePayPalOrder(
        session.accessToken,
        orderId
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to process payment");
      }

      // Update user profile to get the new balance
      if (session?.accessToken) {
        dispatch(fetchUserProfile(session.accessToken));
      }

      // Return success
      return true;
    } catch (error) {
      console.error("Error processing PayPal order:", error);
      toast.error(
        "An error occurred while processing your payment. Please contact support."
      );
      return false;
    }
  };

  const cancelPayPalOrder = async (orderId: string) => {
    if (!session?.accessToken) {
      toast.error("Please log in to continue");
      return;
    }
    if (!orderId) {
      toast.error("An error occurred");
      return;
    }
    const response = await transactionApi.cancelPayPalOrder(
      session.accessToken,
      orderId,
    );
    if (!response.success) {
      toast.error(response.message || "An error occurred while canceling the payment.");
      return;
    }
    toast.success("Payment has been canceled.");
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="paypal-container">
        {isPending && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner size="md" />
            <span className="ml-2">Processing...</span>
          </div>
        )}

        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          }}
          disabled={isPending}
          forceReRender={[amount, currency, description]}
          createOrder={async () => {
            const orderId = await createPayPalOrder();
            if (!orderId) {
              throw new Error("Failed to create order");
            }
            return orderId;
          }}
          onApprove={async (data) => {
            try {
              setIsPending(true);

              // If we have returnUrl, redirect to it instead of processing here
              // if (returnUrl) {
              //   onSuccess({
              //     orderID: data.orderID,
              //     paypalOrderId: data.orderID,
              //     status: "APPROVED",
              //   });
              //   return;
              // }

              // Process the payment through our backend
              const success = await processApprovedOrder(data.orderID);

              setIsPending(false);

              if (success) {
                // Pass the transaction details to the parent component
                onSuccess({
                  orderID: data.orderID,
                  paypalOrderId: data.orderID,
                  status: "COMPLETED",
                });
              } else {
                throw new Error("Payment processing failed");
              }
            } catch (err) {
              setIsPending(false);
              onError(err);
            }
          }}
          onError={(err) => {
            setIsPending(false);
            onError(err);
            toast.error("An error occurred during the payment process.");
          }}
          onCancel={(data) => {
            cancelPayPalOrder(data?.orderID as string);

            // If we have cancelUrl, redirect to it
            // if (cancelUrl && typeof window !== "undefined") {
            //   window.location.href = cancelUrl;
            // }
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
