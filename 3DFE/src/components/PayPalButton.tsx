"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: Record<string, unknown>) => void;
  onError: (err: Error | unknown) => void;
}

export default function PayPalButton({
  amount,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return;
  }
  const initialOptions = {
    clientId: clientId,
    currency: "USD",
    intent: "capture",
  };

  // Convert VND to USD (approximate rate: 1 USD = 24,000 VND)
  // Ensure minimum amount is $0.01
  const usdAmount = Math.max(amount / 24000, 0.01).toFixed(2);

  // Don't render if amount is 0 or negative
  if (amount <= 0) {
    return (
      <div className="w-full py-4 px-6 bg-gray-100 border border-gray-300 rounded-lg text-center text-gray-500">
        Vui lòng chọn gói hoặc nhập số tiền để thanh toán
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="paypal-container">
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          }}
          disabled={isPending}
          createOrder={(data, actions) => {
            setIsPending(true);
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    value: usdAmount,
                    currency_code: "USD",
                  },
                  description: `3DS Blue - Diamond Purchase (${amount.toLocaleString(
                    "vi-VN"
                  )} VND)`,
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              const details = await actions.order!.capture();
              setIsPending(false);
              onSuccess(details);
            } catch (err) {
              setIsPending(false);
              onError(err);
            }
          }}
          onError={(err) => {
            setIsPending(false);
            onError(err);
          }}
          onCancel={() => {
            setIsPending(false);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
