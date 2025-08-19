"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import PayPalButton from "@/components/PayPalButton";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchUserProfile } from "@/lib/store/userSlice";
import { CircleDollarSign } from "lucide-react";

export default function DepositPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>("");
  const [cancelUrl, setCancelUrl] = useState<string>("");

  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");

  // Use Redux store
  const dispatch = useAppDispatch();
  const { profile, isLoading: isLoadingStore } = useAppSelector(
    (state) => state.user
  );

  // Function to fetch profile directly using Redux
  const fetchProfile = useCallback(async () => {
    // If we already have the profile data, just return it without API call
    if (profile) return profile;

    try {
      const token = session?.accessToken as string | undefined;
      const result = await dispatch(fetchUserProfile(token)).unwrap();
      return result;
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    return null;
  }, [profile, session, dispatch]);

  // User info
  const username = profile?.fullName || session?.user?.name || "Guest";
  const userBalance = profile?.balance || 0;

  useEffect(() => {
    // Check if we have a session
    if (!session) {
      // Wait a moment and try to get the session again (in case it's still loading)
      const timer = setTimeout(async () => {
        await updateSession();

        // If we still don't have a session after update, redirect to login
        if (!session) {
          toast.error("Please login to deposit funds");
          router.push("/signin?callbackUrl=" + encodeURIComponent("/deposit"));
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Fetch user profile to get the latest balance
    fetchProfile();

    // Set the return and cancel URLs
    if (typeof window !== "undefined") {
      setReturnUrl(`${window.location.origin}/deposit/success`);
      setCancelUrl(`${window.location.origin}/deposit/cancel`);
    }
  }, [session, router, updateSession, fetchProfile]);

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      setIsLoading(true);

      // Update the session to get the new balance
      await updateSession();

      // Fetch user profile to get the latest balance
      await fetchProfile();

      toast.success(
        "Payment successful! coin have been added to your account."
      );

      // Reset form
      setCoinAmount(0);
      setIsLoading(false);

      // Redirect to profile page after successful payment
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("An error occurred while processing your payment.");
      setIsLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: Error | unknown) => {
    console.error("Payment error:", error);
    toast.error("Payment failed. Please try again later.");
    setIsLoading(false);
  };

  // Calculate USD amount from coin amount
  const getUsdAmount = (): number => {
    return coinAmount ? parseFloat((coinAmount * 0.01).toFixed(2)) : 0;
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg p-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
                <Image
                  src={profile?.avatar || "/logo/logo.png"}
                  alt="Profile avatar"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{username}</h3>
                <p className="text-sm text-gray-600">
                  Current balance:{" "}
                  {isLoadingStore ? (
                    <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    <span className="text-gray-800">
                      {userBalance.toLocaleString()} 
                      <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1 mt-[1px]" />
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Link href="/profile" passHref>
              <Button
                variant="outline"
                className="bg-black hover:bg-white text-yellow-400 border-none"
              >
                View Profile
              </Button>
            </Link>
          </div>

          {/* Purchase Options */}
          <div className="bg-white rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Deposit:</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-700">Add coin:</span>
                <div className="flex-1 border border-gray-300 rounded-md flex items-center bg-white">
                  <Input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(Number(e.target.value))}
                    className="border-0 bg-transparent focus:ring-0"
                  />
                  <div className="px-3">
                    <CircleDollarSign className="w-5 h-5 text-yellow-500" />  
                  </div>
                </div>
                <span className="text-gray-700">=</span>
                <div className="w-32">
                  <Input
                    type="number"
                    value={getUsdAmount()}
                    onChange={(e) =>
                      setCoinAmount(Number(e.target.value) / 0.01)
                    }
                    className="bg-transparent border border-gray-300"
                  />
                </div>
                <span className="text-gray-700">USD</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Your Selection:
              </h3>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    You will receive
                  </div>
                  <div className="text-5xl font-bold flex items-center text-amber-600 mb-2">
                    {coinAmount.toLocaleString()}{" "}
                    <span className="ml-2">
                      <CircleDollarSign className="w-8 h-8 text-yellow-500" />
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Equivalent to{" "}
                    <span className="font-semibold text-blue-600">
                      ${getUsdAmount()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Selection Options */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Quick Coin Package Selection:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { amount: 1000, price: 10, name: "Basic Package" },
                    { amount: 2000, price: 20, name: "Standard Package" },
                    { amount: 5000, price: 50, name: "Advanced Package" },
                    { amount: 10000, price: 100, name: "VIP Package" },
                    {
                      amount: 20000,
                      price: 180,
                      name: "Super VIP Package",
                      discount: "10%",
                    },
                    {
                      amount: 50000,
                      price: 400,
                      name: "Pro Package",
                      discount: "20%",
                    },
                  ].map((option) => (
                    <button
                      key={option.amount}
                      onClick={() => setCoinAmount(option.amount)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        coinAmount === option.amount
                          ? "border-yellow-400 bg-yellow-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-yellow-200 hover:bg-yellow-50"
                      } relative`}
                    >
                      {option.discount && (
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-12 h-12 flex items-center justify-center transform rotate-12 shadow-md">
                          -{option.discount}
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {option.name}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-lg">
                        {option.amount}
                        <span className="ml-1">
                          <CircleDollarSign className="w-4 h-4 text-yellow-500" />
                        </span>
                      </div>
                      <div className="text-blue-600 font-medium mt-1">
                        ${option.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Or enter custom amount:
                </h4>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Input
                      type="number"
                      value={coinAmount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setCoinAmount(value);
                      }}
                      className="pr-12 border-gray-300"
                      placeholder="Enter coin amount"
                      min={1000}
                      step={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span>
                        <CircleDollarSign className="w-5 h-5 text-yellow-500" />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                      onClick={() =>
                        setCoinAmount(
                          Math.max(
                            1000,
                            Math.round(coinAmount / 1000) * 1000
                          )
                        )
                      }
                      variant="outline"
                      className="whitespace-nowrap flex-1 md:flex-none"
                    >
                      Round
                    </Button>
                    <Button
                      onClick={() => {
                        const currentValue = coinAmount || 0;
                        setCoinAmount(Math.max(1000, currentValue + 1000));
                      }}
                      variant="outline"
                      className="flex-1 md:flex-none"
                    >
                      +1000
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    Minimum amount: 1,000 coin
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    = ${getUsdAmount()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Payment Methods:
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  Pay with PayPal
                  <Image
                    src="/icons/paypal.svg"
                    alt="PayPal"
                    width={24}
                    height={24}
                    className="ml-auto"
                  />
                </label>

                {/* <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                  />
                  Pay with Momo
                  <div className="flex ml-auto">
                    <Image
                      src="/icons/momo.svg"
                      alt="Momo"
                      width={24}
                      height={24}
                    />
                  </div>
                </label>

                <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="atm"
                    checked={paymentMethod === "atm"}
                    onChange={() => setPaymentMethod("atm")}
                  />
                  Pay with ATM
                  <div className="flex gap-1 ml-auto">
                    <Image
                      src="/icons/vietcombank.png"
                      alt="Vietcombank"
                      width={24}
                      height={24}
                    />
                    <Image
                      src="/icons/agribank.png"
                      alt="Agribank"
                      width={24}
                      height={24}
                    />
                    <Image
                      src="/icons/tpbank.png"
                      alt="TPBank"
                      width={24}
                      height={24}
                    />
                  </div>
                </label> */}
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Payment Amount:
              </h3>

              <div className="text-5xl font-bold text-teal-600 text-center">
                {getUsdAmount()}$
              </div>

              <div className="text-xs text-gray-500 mt-4">
                By clicking &quot;Pay Now&quot; you agree to our{" "}
                <Link href="/terms" className="text-blue-500">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-500">
                  Privacy Policy
                </Link>
              </div>

              {paymentMethod === "paypal" && (
                <div className="mt-4">
                  {coinAmount < 1000 ? (
                    <Button
                      className="w-full bg-gray-400 text-white py-3 text-lg font-medium cursor-not-allowed"
                      disabled={true}
                    >
                      Minimum amount is 1,000 coin
                    </Button>
                  ) : (
                    <PayPalButton
                      amount={getUsdAmount()}
                      onSuccess={() => handlePaymentSuccess()}
                      onError={handlePaymentError}
                      description={`Purchase ${coinAmount.toLocaleString()} coin`}
                      currency="USD"
                      returnUrl={returnUrl}
                      cancelUrl={cancelUrl}
                    />
                  )}
                </div>
              )}

              {paymentMethod !== "paypal" && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg font-medium"
                    disabled={isLoading || coinAmount < 1000}
                  >
                    {coinAmount < 1000
                      ? "Minimum amount is 1,000 coin"
                      : "PAY NOW"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-medium text-gray-800 mb-4">
              Useful Information
            </h3>

            <div className="space-y-6 text-sm">
              <div>
                <p className="text-gray-700 mb-1">
                  1. The minimum purchase amount is 1000 coin
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  2. coin are one-time purchases with unlimited download time.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  3. After payment confirmation, coin will be immediately added to
                  your account.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  4. In case of lost models or unsuccessful downloads, you can
                  recover them in your Purchase History.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  5. If you already have access, any additional purchases will
                  be added to your existing transaction.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  6. When contacting Customer Service, always quote your
                  order number.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  7. coin are sold individually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
