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
import { CircleDollarSign, Loader2 } from "lucide-react";

// API call for VNPay
const createVnpayPayment = async (
  token: string,
  amount: number,
  description?: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/vnpay/create-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        description: description || `Nạp ${amount.toLocaleString()} xu vào tài khoản`,
        ipAddress: "127.0.0.1", // Will be overridden by backend
      }),
    }
  );
  return response.json();
};

export default function DepositPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [coinAmount, setCoinAmount] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>("");
  const [cancelUrl, setCancelUrl] = useState<string>("");

  // Payment methods and region
  const [paymentMethod, setPaymentMethod] = useState<string>("vnpay");
  const [paymentRegion, setPaymentRegion] = useState<string>("vietnam");

  // Use Redux store
  const dispatch = useAppDispatch();
  const { profile, isLoading: isLoadingStore } = useAppSelector(
    (state) => state.user
  );

  // Function to fetch profile directly using Redux
  const fetchProfile = useCallback(async () => {
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
    if (!session) {
      const timer = setTimeout(async () => {
        await updateSession();

        if (!session) {
          toast.error("Vui lòng đăng nhập để nạp xu");
          router.push("/signin?callbackUrl=" + encodeURIComponent("/deposit"));
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    fetchProfile();

    if (typeof window !== "undefined") {
      setReturnUrl(`${window.location.origin}/deposit/success`);
      setCancelUrl(`${window.location.origin}/deposit/cancel`);
    }
  }, [session, router, updateSession, fetchProfile]);

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      setIsLoading(true);
      await updateSession();
      await fetchProfile();

      toast.success(
        "Thanh toán thành công! Xu đã được cộng vào tài khoản của bạn."
      );

      setCoinAmount(50);
      setIsLoading(false);

      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Đã xảy ra lỗi khi xử lý thanh toán.");
      setIsLoading(false);
    }
  };

  // Handle VNPay payment
  const handlePaymentVNPay = async () => {
    try {
      setIsLoading(true);
      const token = session?.accessToken as string | undefined;

      if (!token) {
        toast.error("Vui lòng đăng nhập để nạp xu");
        router.push("/signin?callbackUrl=" + encodeURIComponent("/deposit"));
        return;
      }

      const vndAmount = coinAmount * 1000; // 1 xu = 1000 VND

      const result = await createVnpayPayment(
        token,
        vndAmount,
        `Nạp ${coinAmount.toLocaleString()} xu vào tài khoản 3D Models`
      );

      if (result.code === "00" && result.data) {
        // Redirect to VNPay payment page
        toast.success("Đang chuyển hướng đến VNPay...");
        window.location.href = result.data;
      } else {
        toast.error(result.message || "Không thể tạo thanh toán VNPay");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error processing VNPay payment:", error);
      toast.error("Đã xảy ra lỗi khi tạo thanh toán VNPay");
      setIsLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: Error | unknown) => {
    console.error("Payment error:", error);
    toast.error("Thanh toán thất bại. Vui lòng thử lại sau.");
    setIsLoading(false);
  };

  // Calculate payment amount based on region and coin amount
  const getPaymentAmount = (): number => {
    if (paymentRegion === "international") {
      return coinAmount ? parseFloat((coinAmount * 0.1).toFixed(2)) : 0;
    } else {
      return coinAmount ? coinAmount * 1000 : 0;
    }
  };

  const getPaymentCurrency = (): string => {
    return paymentRegion === "international" ? "USD" : "VND";
  };

  const getMinimumAmount = (): number => {
    return paymentRegion === "vietnam" ? 10 : 50; // VNPay minimum 10,000 VND = 10 xu
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
                <p className="text-base text-gray-600 font-bold">
                  Số dư hiện tại:{" "}
                  {isLoadingStore ? (
                    <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    <span className="text-blue-600 inline-flex items-center">
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
                Xem hồ sơ
              </Button>
            </Link>
          </div>

          {/* Payment Region Selection */}
          <div className="bg-white rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-medium text-gray-800 mb-4">
                Chọn khu vực thanh toán:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setPaymentRegion("international");
                    setPaymentMethod("paypal");
                    setCoinAmount(50);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${paymentRegion === "international"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Thanh toán quốc tế
                    </h4>
                    <p className="text-base text-gray-600 mb-2 flex items-center justify-center">
                      <Image
                        src="/icons/paypal.svg"
                        alt="PayPal"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      Thanh toán PayPal
                    </p>
                    <p className="text-base text-blue-600 font-medium flex items-center justify-center">
                      50{" "}
                      <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1" />{" "}
                      = $5 USD
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPaymentRegion("vietnam");
                    setPaymentMethod("vnpay");
                    setCoinAmount(50);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${paymentRegion === "vietnam"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300"
                    }`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Thanh toán Việt Nam
                    </h4>
                    <p className="text-base text-gray-600 mb-2 flex items-center justify-center">
                      <span className="font-bold text-blue-700 text-lg">VNPay</span>
                    </p>
                    <p className="text-base text-green-600 font-medium flex items-center justify-center">
                      50{" "}
                      <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1" />{" "}
                      = 50,000 VND
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Lựa chọn của bạn:
              </h3>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-base font-medium text-gray-600 mb-2">
                    Bạn sẽ nhận được
                  </div>
                  <div className="text-5xl font-bold flex items-center text-amber-600 mb-2">
                    {coinAmount.toLocaleString()}{" "}
                    <span className="ml-2">
                      <CircleDollarSign className="w-8 h-8 text-yellow-500" />
                    </span>
                  </div>
                  <div className="text-base text-gray-500">
                    Tương đương{" "}
                    <span
                      className={`font-semibold ${paymentRegion === "international"
                        ? "text-blue-600"
                        : "text-green-600"
                        }`}
                    >
                      {getPaymentAmount().toLocaleString()}{" "}
                      {getPaymentCurrency()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-base font-medium text-gray-700 mb-2">
                  Nhập số xu:
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
                      placeholder="Nhập số xu"
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
                      Làm tròn
                    </Button>
                    <Button
                      onClick={() => {
                        const currentValue = coinAmount || 0;
                        setCoinAmount(
                          Math.max(getMinimumAmount(), currentValue + 50)
                        );
                      }}
                      variant="outline"
                      className="flex-1 md:flex-none"
                    >
                      +50
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                  <p className="text-base text-gray-500">
                    Số xu tối thiểu: {getMinimumAmount()} xu
                  </p>
                  <p
                    className={`text-base font-bold ${paymentRegion === "international"
                      ? "text-blue-600"
                      : "text-green-600"
                      }`}
                  >
                    = {getPaymentAmount().toLocaleString()}{" "}
                    {getPaymentCurrency()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Phương thức thanh toán:
              </h3>

              <div className="space-y-4">
                {paymentRegion === "international" ? (
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer p-3 rounded-lg border border-gray-200 bg-blue-50">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium">Thanh toán bằng PayPal</span>
                    <Image
                      src="/icons/paypal.svg"
                      alt="PayPal"
                      width={80}
                      height={24}
                      className="ml-auto"
                    />
                  </label>
                ) : (
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer p-3 rounded-lg border border-gray-200 bg-green-50">
                    <input
                      type="radio"
                      name="payment"
                      value="vnpay"
                      checked={paymentMethod === "vnpay"}
                      onChange={() => setPaymentMethod("vnpay")}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium">Thanh toán qua VNPay</span>
                    <span className="ml-auto font-bold text-blue-700">VNPay</span>
                  </label>
                )}
              </div>

              {/* VNPay supported banks info */}
              {paymentRegion === "vietnam" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>VNPay</strong> hỗ trợ thanh toán qua:
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-white rounded border">ATM/Thẻ nội địa</span>
                    <span className="px-2 py-1 bg-white rounded border">Visa/Mastercard</span>
                    <span className="px-2 py-1 bg-white rounded border">QR Code</span>
                    <span className="px-2 py-1 bg-white rounded border">Ví VNPay</span>
                    <span className="px-2 py-1 bg-white rounded border">Internet Banking</span>
                  </div>
                </div>
              )}
            </div>

            {/* Amount to Pay */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Số tiền thanh toán:
              </h3>

              <div
                className={`text-5xl font-bold text-center ${paymentRegion === "international"
                  ? "text-blue-600"
                  : "text-green-600"
                  }`}
              >
                {getPaymentAmount().toLocaleString()} {getPaymentCurrency()}
              </div>

              <div className="text-base text-gray-500 mt-4">
                Khi nhấn &quot;Thanh toán ngay&quot; bạn đồng ý với{" "}
                <Link href="/terms" className="text-blue-500">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-blue-500">
                  Chính sách bảo mật
                </Link>
              </div>

              {/* PayPal Button for International */}
              {paymentMethod === "paypal" &&
                paymentRegion === "international" && (
                  <div className="mt-4">
                    {coinAmount < getMinimumAmount() ? (
                      <Button
                        className="w-full bg-gray-400 text-white py-3 text-lg font-medium cursor-not-allowed"
                        disabled={true}
                      >
                        Số xu tối thiểu là {getMinimumAmount()} xu
                      </Button>
                    ) : (
                      <PayPalButton
                        amount={getPaymentAmount()}
                        onSuccess={() => handlePaymentSuccess()}
                        onError={handlePaymentError}
                        description={`Mua ${coinAmount.toLocaleString()} xu`}
                        currency="USD"
                        returnUrl={returnUrl}
                        cancelUrl={cancelUrl}
                      />
                    )}
                  </div>
                )}

              {/* VNPay Button for Vietnam */}
              {paymentRegion === "vietnam" && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-medium shadow-lg"
                    disabled={isLoading || coinAmount < getMinimumAmount()}
                    onClick={handlePaymentVNPay}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : coinAmount < getMinimumAmount() ? (
                      `Số xu tối thiểu là ${getMinimumAmount()} xu`
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span className="font-bold">VNPay</span>
                        THANH TOÁN VỚI VNPAY
                      </span>
                    )}
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
              Thông tin hữu ích
            </h3>

            <div className="space-y-6 text-base">
              <div>
                <p className="text-gray-700 mb-1">
                  1. Số xu tối thiểu để nạp là {getMinimumAmount()} xu
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">2. Tỷ giá:</p>
                <div className="ml-4 text-base">
                  <p className="text-blue-600">• Quốc tế: 50 xu = $5 USD</p>
                  <p className="text-green-600">• Việt Nam: 50 xu = 50.000 VND</p>
                </div>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  3. Xu là giao dịch một lần với thời gian tải về không giới hạn.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  4. Sau khi xác nhận thanh toán VNPay, xu sẽ được cộng ngay vào
                  tài khoản của bạn.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  5. VNPay hỗ trợ thanh toán qua thẻ ATM, Visa, Mastercard, QR Code
                  và Internet Banking của hơn 40 ngân hàng.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  6. Nếu gặp lỗi thanh toán, vui lòng liên hệ CSKH kèm mã giao dịch.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  7. Thời gian xử lý giao dịch VNPay: tức thì.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
