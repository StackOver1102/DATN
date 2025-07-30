"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import PayPalButton from "@/components/PayPalButton";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import { useApi } from "@/lib/hooks/useApi";
import { User } from "@/lib/types";

export default function DepositPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const api = useApi();
  const [diamondAmount, setDiamondAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>('');
  const [cancelUrl, setCancelUrl] = useState<string>('');

  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");

  // Use Zustand store directly
  const { 
    profile, 
    setProfile, 
    isLoading: isLoadingStore,
    setHasLoadedProfile
  } = useUserStore();

  // Function to fetch profile directly
  const fetchProfile = async () => {
    // If we already have the profile data, just return it without API call
    if (profile) return profile;
    
    try {
      const response = await api.get<User>('users/profile');
      if (response.success && response.data) {
        setProfile(response.data);
        setHasLoadedProfile(true);
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    return null;
  };

  // User info
  const username = profile?.fullName || session?.user?.name || "Guest";
  const userBalance = profile?.balance || 0;

  useEffect(() => {
    console.log(session);
    
    // Check if we have a session
    if (!session) {
      // Wait a moment and try to get the session again (in case it's still loading)
      const timer = setTimeout(async () => {
        await updateSession();
        
        // If we still don't have a session after update, redirect to login
        if (!session) {
          toast.error("Vui lòng đăng nhập để nạp tiền");
          router.push("/signin?callbackUrl=" + encodeURIComponent("/deposit"));
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // Fetch user profile to get the latest balance
    fetchProfile();
    
    // Set the return and cancel URLs
    if (typeof window !== 'undefined') {
      setReturnUrl(`${window.location.origin}/deposit/success`);
      setCancelUrl(`${window.location.origin}/deposit/cancel`);
    }
  }, [session, router, updateSession]);

  // Handle payment success
  const handlePaymentSuccess = async (details: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      
      // Update the session to get the new balance
      await updateSession();
      
      // Fetch user profile to get the latest balance
      await fetchProfile();
      
      toast.success(
        "Thanh toán thành công! Kim cương đã được nạp vào tài khoản."
      );
      
      // Reset form
      setDiamondAmount(0);
      setIsLoading(false);
      
      // Redirect to profile page after successful payment
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Có lỗi xảy ra khi xử lý thanh toán.");
      setIsLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: Error | unknown) => {
    console.error("Payment error:", error);
    toast.error("Thanh toán thất bại. Vui lòng thử lại sau.");
    setIsLoading(false);
  };

  // Calculate USD amount from diamond amount
  const getUsdAmount = (): number => {
    return diamondAmount ? parseFloat((diamondAmount * 0.01).toFixed(2)) : 0;
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
                  src="/logo/logo.png"
                  alt="Profile avatar"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{username}</h3>
                <p className="text-sm text-gray-600">
                  Số dư hiện tại:{" "}
                  {isLoadingStore ? (
                    <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    <span className="text-gray-800">{userBalance.toLocaleString()} Kim cương</span>
                  )}
                </p>
              </div>
            </div>
            <Link href="/profile" passHref>
              <Button
                variant="outline"
                className="bg-blue-500 hover:bg-blue-600 text-white border-none"
              >
                Xem hồ sơ
              </Button>
            </Link>
          </div>

          {/* Purchase Options */}
          <div className="bg-white rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Nạp tiền:</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-700">Nạp Kim cương:</span>
                <div className="flex-1 border border-gray-300 rounded-md flex items-center bg-white">
                  <Input
                    type="number"
                    value={diamondAmount}
                    onChange={(e) => setDiamondAmount(Number(e.target.value))}
                    className="border-0 bg-transparent focus:ring-0"
                  />
                  <div className="px-3">
                    <Image
                      src="/icons/diamond.svg"
                      alt="Diamond"
                      width={20}
                      height={20}
                    />
                  </div>
                </div>
                <span className="text-gray-700">=</span>
                <div className="w-32">
                  <Input
                    type="number"
                    value={getUsdAmount()}
                    onChange={(e) =>
                      setDiamondAmount(Number(e.target.value) / 0.01)
                    }
                    className="bg-transparent border border-gray-300"
                  />
                </div>
                <span className="text-gray-700">USD</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">Lựa chọn của bạn:</h3>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">Bạn sẽ nhận được</div>
                  <div className="text-5xl font-bold flex items-center text-amber-600 mb-2">
                    {diamondAmount.toLocaleString()}{" "}
                    <Image
                      src="/icons/diamond.svg"
                      alt="Diamond"
                      width={32}
                      height={32}
                      className="ml-2"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Tương đương <span className="font-semibold text-blue-600">${getUsdAmount()}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Selection Options */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Chọn nhanh gói Kim cương:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { amount: 1000, price: 10, name: "Gói Cơ Bản" },
                    { amount: 2000, price: 20, name: "Gói Tiêu Chuẩn" },
                    { amount: 5000, price: 50, name: "Gói Nâng Cao" },
                    { amount: 10000, price: 100, name: "Gói VIP" },
                    { amount: 20000, price: 180, name: "Gói Super VIP", discount: "10%" },
                    { amount: 50000, price: 400, name: "Gói Pro", discount: "20%" },
                  ].map((option) => (
                    <button
                      key={option.amount}
                      onClick={() => setDiamondAmount(option.amount)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        diamondAmount === option.amount
                          ? "border-yellow-400 bg-yellow-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-yellow-200 hover:bg-yellow-50"
                      } relative`}
                    >
                      {option.discount && (
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-12 h-12 flex items-center justify-center transform rotate-12 shadow-md">
                          -{option.discount}
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-600 mb-1">{option.name}</div>
                      <div className="flex items-center gap-1 font-bold text-lg">
                        {option.amount.toLocaleString()}
                        <Image
                          src="/icons/diamond.svg"
                          alt="Diamond"
                          width={16}
                          height={16}
                        />
                      </div>
                      <div className="text-blue-600 font-medium mt-1">${option.price}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Amount */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hoặc nhập số lượng tùy chỉnh:</h4>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Input
                      type="number"
                      value={diamondAmount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setDiamondAmount(value);
                      }}
                      className="pr-12 border-gray-300"
                      placeholder="Nhập số lượng kim cương"
                      min={1000}
                      step={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Image
                        src="/icons/diamond.svg"
                        alt="Diamond"
                        width={20}
                        height={20}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button 
                      onClick={() => setDiamondAmount(Math.max(1000, Math.round(diamondAmount / 1000) * 1000))}
                      variant="outline"
                      className="whitespace-nowrap flex-1 md:flex-none"
                    >
                      Làm tròn
                    </Button>
                    <Button
                      onClick={() => {
                        const currentValue = diamondAmount || 0;
                        setDiamondAmount(Math.max(1000, currentValue + 1000));
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
                    Số lượng tối thiểu: 1,000 kim cương
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
                Phương thức thanh toán:
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
                  Thanh toán bằng PayPal
                  <Image
                    src="/icons/paypal.svg"
                    alt="PayPal"
                    width={24}
                    height={24}
                    className="ml-auto"
                  />
                </label>

                <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                  />
                  Nạp tiền bằng Momo
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
                  Nạp tiền bằng ATM
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
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">Số tiền thanh toán:</h3>

              <div className="text-5xl font-bold text-teal-600 text-center">
                {getUsdAmount()}$
              </div>

              <div className="text-xs text-gray-500 mt-4">
                Bằng cách nhấn &quot;Thanh toán&quot; bạn đồng ý với{" "}
                <Link href="/terms" className="text-blue-500">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-blue-500">
                  Chính sách bảo mật
                </Link>
              </div>

              {paymentMethod === "paypal" && (
                <div className="mt-4">
                  {diamondAmount < 1000 ? (
                    <Button 
                      className="w-full bg-gray-400 text-white py-3 text-lg font-medium cursor-not-allowed"
                      disabled={true}
                    >
                      Số lượng tối thiểu là 1,000 Kim cương
                    </Button>
                  ) : (
                    <PayPalButton
                      amount={getUsdAmount()}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      description={`Nạp ${diamondAmount.toLocaleString()} Kim cương`}
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
                    disabled={isLoading || diamondAmount < 1000}
                  >
                    {diamondAmount < 1000 ? 'Số lượng tối thiểu là 1,000 Kim cương' : 'THANH TOÁN NGAY'}
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

            <div className="space-y-6 text-sm">
              <div>
                <p className="text-gray-700 mb-1">
                  1. Số lượng tối thiểu để mua là 1000 Kim cương
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  2. Kim cương được lấy một lần và không giới hạn thời gian tải
                  xuống.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  3. Sau khi xác nhận thanh toán, kim cương sẽ được nạp ngay vào tài khoản của bạn.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  4. Trong trường hợp mất mô hình chuyên nghiệp hoặc không thành
                  công khi tải xuống, bạn có thể khôi phục nó trong Lịch sử Mua
                  hàng.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  5. Nếu bạn đã có quyền truy cập, mọi giao dịch mua thêm sẽ
                  được thêm vào giao dịch hiện có.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  6. Khi liên hệ với Dịch vụ Khách hàng, hãy luôn trích dẫn số
                  đơn đặt hàng của bạn.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  7. Kim cương được bán theo từng chiếc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
