"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import PayPalButton from "@/components/PayPalButton";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BuyPage() {
  const { data: session } = useSession();
  const [diamondAmount, setDiamondAmount] = useState<number>(0);
  const [freeModelsPerDay] = useState<number>(30);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");

  // User info
  const username = session?.user?.name || "ntu20025537";

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      toast.success(
        "Thanh toán thành công! Kim cương đã được nạp vào tài khoản."
      );
      // Here you would call your API to update the user's diamond balance
      // Reset form
      setDiamondAmount(0);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Có lỗi xảy ra khi xử lý thanh toán.");
    }
  };

  // Handle payment error
  const handlePaymentError = (error: Error | unknown) => {
    console.error("Payment error:", error);
    toast.error("Thanh toán thất bại. Vui lòng thử lại sau.");
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
                  Profile status:{" "}
                  <span className="text-gray-800">No Purchases</span>
                </p>
              </div>
            </div>
            <Link href="/profile" passHref>
              <Button
                variant="outline"
                className="bg-blue-500 hover:bg-blue-600 text-white border-none"
              >
                View Profile
              </Button>
            </Link>
          </div>

          {/* Purchase Options */}
          <div className="bg-white rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Basket:</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-700">Recharge Diamonds:</span>
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
                    value={diamondAmount ? diamondAmount * 0.01 : 0}
                    onChange={(e) =>
                      setDiamondAmount(Number(e.target.value) / 1000)
                    }
                    className="bg-transparent border border-gray-300"
                  />
                </div>
                <span className="text-gray-700">dollar</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Increase FREE models limits:
                </span>
                <span className="text-gray-700">
                  {freeModelsPerDay} models per day for
                </span>
                <select
                  className="bg-transparent border border-gray-300 rounded text-gray-700 p-1"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  <option value="0">0 month</option>
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">Your Choice:</h3>

              <div className="flex items-center gap-6">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 flex flex-col items-center justify-center flex-1">
                  <div className="text-4xl font-bold flex items-center text-gray-800">
                    {diamondAmount}{" "}
                    <Image
                      src="/icons/diamond.svg"
                      alt="Diamond"
                      width={24}
                      height={24}
                      className="ml-2"
                    />
                  </div>
                </div>
                <div className="text-2xl text-gray-700">+</div>
                <div className="bg-teal-100 border border-teal-300 rounded-lg p-6 flex flex-col items-center justify-center flex-1">
                  <div className="text-4xl font-bold text-gray-800">
                    30 Free
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Models per day during {selectedMonth} month
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    renewed at 00:00 GMT +4
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Payment Method:
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
              <h3 className="font-medium text-gray-800 mb-4">Amount to pay:</h3>

              <div className="text-5xl font-bold text-teal-600 text-center">
                {diamondAmount ? diamondAmount * 0.01 : 0}$
              </div>

              <div className="text-xs text-gray-500 mt-4">
                By clicking &quot;Pay&quot; you agree to{" "}
                <Link href="/terms" className="text-blue-500">
                  The Terms of Use for Customers
                </Link>{" "}
                and agree to{" "}
                <Link href="/privacy" className="text-blue-500">
                  The Privacy policy
                </Link>
              </div>

              {paymentMethod === "paypal" && diamondAmount > 0 && (
                <div className="mt-4">
                  <PayPalButton
                    amount={diamondAmount * 0.01}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>
              )}

              {paymentMethod !== "paypal" && (
                <div className="mt-4">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2">
                    PAY
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
              Helpful Information
            </h3>

            <div className="space-y-6 text-sm">
              <div>
                <p className="text-gray-700 mb-1">
                  1. Minimum quantity to buy is 1000 Diamond
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  2. Diamond is obtained once and has no download time limit.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  3. After payment confirmation (1-2 hours) login and check your
                  access.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  4. In case of pro-model loss or unsuccessful download, you can
                  restore it in Purchase History.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  5. If you already have access, any additional purchases will
                  be added to existing one.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  6. When contacting Customer Service always quote your order
                  number.
                </p>
              </div>

              <div>
                <p className="text-gray-700 mb-1">
                  7. Diamond are sold by the piece.
                </p>
                <div className="border-b border-gray-200 my-4"></div>
              </div>

              {/* Vietnamese translation */}
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
                  3. Sau khi xác nhận thanh toán (1-2 giờ) đăng nhập và kiểm tra
                  quyền truy cập của bạn.
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
