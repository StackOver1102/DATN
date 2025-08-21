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

  // Payment methods and region
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");
  const [paymentRegion, setPaymentRegion] = useState<string>("international"); // "international" or "vietnam"

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

  // Calculate payment amount based on region and coin amount
  const getPaymentAmount = (): number => {
    if (paymentRegion === "international") {
      // International: 50 xu = 5$, so 1 xu = 0.1$
      return coinAmount ? parseFloat((coinAmount * 0.1).toFixed(2)) : 0;
    } else {
      // Vietnam: 50 xu = 50k, so 1 xu = 1k
      return coinAmount ? coinAmount * 1000 : 0;
    }
  };

  const getPaymentCurrency = (): string => {
    return paymentRegion === "international" ? "USD" : "VND";
  };

  const getMinimumAmount = (): number => {
    return 50; // Both regions have minimum 50 xu
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
                    <span className="text-gray-800 inline-flex items-center">
                      {userBalance.toLocaleString()} 
                      <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1" />
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

          {/* Payment Region Selection */}
          <div className="bg-white rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Choose Payment Region:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setPaymentRegion("international");
                    setPaymentMethod("paypal");
                    setCoinAmount(0);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentRegion === "international"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">International Payment</h4>
                    <p className="text-sm text-gray-600 mb-2">PayPal Payment</p>
                    <p className="text-xs text-blue-600 font-medium flex items-center justify-center">50 <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1" /> = $5 USD</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPaymentRegion("vietnam");
                    setPaymentMethod("momo");
                    setCoinAmount(0);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentRegion === "vietnam"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">Vietnam Payment</h4>
                    <p className="text-sm text-gray-600 mb-2">Momo / Banking</p>
                    <p className="text-xs text-green-600 font-medium flex items-center justify-center">50 <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1" /> = 50,000 VND</p>
                  </div>
                </button>
              </div>
            </div>

            {/* <div>
              <h3 className="font-medium text-gray-800 mb-2">Deposit:</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-700">Add coin:</span>
                <div className="flex-1 border border-gray-300 rounded-md flex items-center bg-white">
                  <Input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(Number(e.target.value))}
                    className="border-0 bg-transparent focus:ring-0"
                    min={getMinimumAmount()}
                    step={10}
                  />
                  <div className="px-3">
                    <CircleDollarSign className="w-5 h-5 text-yellow-500" />  
                  </div>
                </div>
                <span className="text-gray-700">=</span>
                <div className="w-32">
                  <Input
                    type="number"
                    value={getPaymentAmount()}
                    readOnly
                    className="bg-gray-50 border border-gray-300"
                  />
                </div>
                <span className="text-gray-700">{getPaymentCurrency()}</span>
              </div>
            </div> */}

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
                    <span className={`font-semibold ${paymentRegion === "international" ? "text-blue-600" : "text-green-600"}`}>
                      {getPaymentAmount().toLocaleString()} {getPaymentCurrency()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Enter coin amount:
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
                      min={getMinimumAmount()}
                      step={10}
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
                            getMinimumAmount(),
                            Math.round(coinAmount / 50) * 50
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
                        setCoinAmount(Math.max(getMinimumAmount(), currentValue + 50));
                      }}
                      variant="outline"
                      className="flex-1 md:flex-none"
                    >
                      +50
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    Minimum amount: {getMinimumAmount()} coin
                  </p>
                  <p className={`text-xs font-medium ${paymentRegion === "international" ? "text-blue-600" : "text-green-600"}`}>
                    = {getPaymentAmount().toLocaleString()} {getPaymentCurrency()}
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
                {paymentRegion === "international" ? (
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
                ) : (
                  <>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
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
                        value="banking"
                        checked={paymentMethod === "banking"}
                        onChange={() => setPaymentMethod("banking")}
                      />
                      Pay with Banking
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
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Payment Amount:
              </h3>

              <div className={`text-5xl font-bold text-center ${paymentRegion === "international" ? "text-blue-600" : "text-green-600"}`}>
                {getPaymentAmount().toLocaleString()} {getPaymentCurrency()}
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

              {paymentMethod === "paypal" && paymentRegion === "international" && (
                <div className="mt-4">
                  {coinAmount < getMinimumAmount() ? (
                    <Button
                      className="w-full bg-gray-400 text-white py-3 text-lg font-medium cursor-not-allowed"
                      disabled={true}
                    >
                      Minimum amount is {getMinimumAmount()} coin
                    </Button>
                  ) : (
                    <PayPalButton
                      amount={getPaymentAmount()}
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

              {paymentRegion === "vietnam" && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-medium"
                    disabled={isLoading || coinAmount < getMinimumAmount()}
                  >
                    {coinAmount < getMinimumAmount()
                      ? `Minimum amount is ${getMinimumAmount()} coin`
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
                  1. The minimum purchase amount is {getMinimumAmount()} coin
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  2. Exchange rate:
                </p>
                <div className="ml-4 text-xs">
                  <p className="text-blue-600">• International: 50 coin = $5 USD</p>
                  <p className="text-green-600">• Vietnam: 50 coin = 50,000 VND</p>
                </div>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  3. coin are one-time purchases with unlimited download time.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  4. After payment confirmation, coin will be immediately added to
                  your account.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  5. In case of lost models or unsuccessful downloads, you can
                  recover them in your Purchase History.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  6. If you already have access, any additional purchases will
                  be added to your existing transaction.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  7. When contacting Customer Service, always quote your
                  order number.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
