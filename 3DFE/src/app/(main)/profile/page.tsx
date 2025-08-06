"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Lock,
  ShoppingBag,
  CreditCard,
  Edit3,
  Save,
  Eye,
  EyeOff,
  DollarSign,
  AlertTriangle,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi, useFetchData, useUpdateData } from "@/lib/hooks/useApi";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setProfile, setHasLoadedProfile } from "@/lib/store/userSlice";
import { User } from "@/lib/types";
import { Product } from "@/interface/product";
import Pagination from "@/components/Pagination";
import { PaginatedResult } from "@/interface/pagination";
import { Session } from "next-auth";

type TabType = "info" | "password" | "purchases" | "payments";

interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  joinDate: string;
  balance: number;
  totalDownloads: number;
}

interface Purchase {
  _id: string;
  modelName: string;
  totalAmount: number;
  createdAt: string;
  status: "completed" | "pending" | "refunded";
  downloadLink: string;
  image: string;
  productId: Product;
}

interface Payment {
  _id: string;
  amount: number;
  method: string;
  createdAt: string;
  status: "completed" | "pending" | "failed";
  description: string;
  type: "deposit" | "payment";
  transactionCode: string;
  balanceAfter?: number;
  balanceBefore?: number;
}

// Schema validation for user profile form
const userProfileSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Schema validation for password change form
const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type UserProfileFormValues = z.infer<typeof userProfileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Component to handle search params
function ProfileContentInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  // const paymentSuccess = searchParams?.get("payment_success");
  const router = useRouter();
  const { data: session } = useSession();

  // Rest of the component logic
  return (
    <ProfilePageContent session={session} tabParam={tabParam} router={router} />
  );
}

export default function ProfileContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      }
    >
      <ProfileContentInner />
    </Suspense>
  );
}

// Main component that doesn't directly use searchParams
function ProfilePageContent({
  session,
  tabParam,
  router,
}: {
  session: Session | null;
  tabParam: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  // Use Redux hooks
  const dispatch = useAppDispatch();
  const { profile, isLoading: isLoadingStore } = useAppSelector(
    (state) => state.user
  );

  // Set active tab based on URL parameter if available
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === "purchases" ||
      tabParam === "payments" ||
      tabParam === "password"
      ? (tabParam as TabType)
      : "info"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [refundReason, setRefundReason] = useState("");

  // Pagination states
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const itemsPerPage = 5;

  const { data: purchasesData, isLoading: isLoadingPurchases } = useFetchData<
    PaginatedResult<Purchase>
  >(
    `orders/my-orders?page=${purchasesPage}&limit=${itemsPerPage}`,
    ["purchases", purchasesPage.toString()],
    {
      enabled: activeTab === "purchases",
    }
  );

  const { data: paymentsData, isLoading: isLoadingPayments } = useFetchData<
    PaginatedResult<Payment>
  >(
    `transactions/my-transactions?page=${paymentsPage}&limit=${itemsPerPage}`,
    ["transactions", paymentsPage.toString()],
    {
      enabled: activeTab === "payments",
    }
  );

  // Extract data from paginated responses
  const purchases = purchasesData?.items || [];
  const purchasesTotalPages = purchasesData?.meta.totalPages || 1;

  const payments = paymentsData?.items || [];
  const paymentsTotalPages = paymentsData?.meta.totalPages || 1;

  const { post } = useApi();

  // User profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
  } = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: session?.user?.name || "",
      email: session?.user?.email || "",
      phone: "",
      address: "",
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // State for user data
  const [userData, setUserData] = useState<UserInfo>({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    avatar:
      session?.user?.image ||
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    joinDate: new Date().toISOString().split("T")[0],
    balance: session?.user?.balance || 0,
    totalDownloads: 0,
  });

  // Update userData and form values when profile changes
  useEffect(() => {
    if (profile) {
      setUserData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        avatar:
          profile.avatar ||
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        joinDate: profile.createdAt
          ? new Date(profile.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        balance: profile.balance || 0,
        totalDownloads: profile.totalDownloads || 0,
      });

      // Update form values
      setProfileValue("fullName", profile.fullName || "");
      setProfileValue("email", profile.email || "");
      setProfileValue("phone", profile.phone || "");
      setProfileValue("address", profile.address || "");
    }
  }, [profile, setProfileValue]);

  const tabs = [
    { id: "info" as TabType, label: "Thông tin cá nhân", icon: UserIcon },
    { id: "password" as TabType, label: "Đổi mật khẩu", icon: Lock },
    {
      id: "purchases" as TabType,
      label: "Lịch sử mua hàng",
      icon: ShoppingBag,
    },
    { id: "payments" as TabType, label: "Lịch sử nạp tiền", icon: CreditCard },
  ];

  // Update profile mutation
  const updateProfileMutation = useUpdateData<
    User,
    Partial<User> & { userId: string }
  >("users", ["userProfile"], {
    onSuccess: (updatedData) => {
      // Update the Redux store with the new data
      dispatch(setProfile(updatedData));
      dispatch(setHasLoadedProfile(true));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useUpdateData<
    { message: string },
    { oldPassword: string; newPassword: string }
  >("users/change-password", ["userPassword"], {
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Handle profile form submission
  const onSubmitProfile = async (data: UserProfileFormValues) => {
    try {
      if (session?.user?.id) {
        await updateProfileMutation.mutateAsync({
          userId: session.user.id,
          ...data,
        });
        setIsEditing(false);
        toast.success("Thông tin đã được cập nhật thành công!");
      }
    } catch (error) {
      toast.error(
        `Có lỗi xảy ra khi cập nhật thông tin: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle password form submission
  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      toast.success("Mật khẩu đã được thay đổi thành công!");
    } catch (error) {
      toast.error(
        `${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleRefundRequest = (purchase: Purchase) => {
    console.log(purchase);
    setSelectedPurchase(purchase);
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundReason.trim()) {
      alert("Vui lòng nhập lý do hoàn hàng!");
      return;
    }

    try {
      // Handle refund request submission
      const response = await post(`refund`, {
        description: refundReason,
        orderId: selectedPurchase?._id,
      });

      if (response.success) {
        // Close modal and reset
        setShowRefundModal(false);
        setSelectedPurchase(null);
        setRefundReason("");
        toast.success(
          "Yêu cầu hoàn hàng đã được gửi! Chúng tôi sẽ xử lý trong vòng 24-48 giờ."
        );
      }
    } catch (error) {
      console.error("Error submitting refund request:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu hoàn hàng!");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "refunded":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "Hoàn thành";
      case "pending":
        return "Đang xử lý";
      case "failed":
        return "Thất bại";
      case "refunded":
        return "Hoàn tiền";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoadingPurchases || isLoadingPayments || isLoadingStore) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading variant="spinner" size="lg" text="Đang tải thông tin..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Image
                  src={userData.avatar}
                  alt="Avatar"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-blue-100"
                />
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userData.fullName}
                </h1>
                <p className="text-gray-600 mb-4">{userData.email}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(userData.balance)}
                    </div>
                    <div className="text-sm text-gray-600">Số tiền còn lại</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {userData.totalDownloads}
                    </div>
                    <div className="text-sm text-gray-600">Lượt tải về</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatDate(userData.joinDate)}
                    </div>
                    <div className="text-sm text-gray-600">Ngày tham gia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "info" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Thông tin cá nhân
                    </h2>
                    <Button
                      onClick={() =>
                        isEditing
                          ? handleSubmitProfile(onSubmitProfile)()
                          : setIsEditing(true)
                      }
                      className="flex items-center gap-2 text-yellow-400"
                    >
                      {isEditing ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Edit3 className="w-4 h-4" />
                      )}
                      {isEditing ? "Lưu" : "Chỉnh sửa"}
                    </Button>
                  </div>

                  <form
                    onSubmit={handleSubmitProfile(onSubmitProfile)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên
                      </label>
                      <input
                        {...registerProfile("fullName")}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border ${
                          profileErrors.fullName
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {profileErrors.fullName && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileErrors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        {...registerProfile("email")}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border ${
                          profileErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {profileErrors.email && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileErrors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        {...registerProfile("phone")}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border ${
                          profileErrors.phone
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500`}
                      />
                      {profileErrors.phone && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileErrors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ
                      </label>
                      <textarea
                        {...registerProfile("address")}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-4 py-3 border ${
                          profileErrors.address
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none`}
                      />
                      {profileErrors.address && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileErrors.address.message}
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-6 max-w-md">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Đổi mật khẩu
                  </h2>

                  <form
                    onSubmit={handleSubmitPassword(onSubmitPassword)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          {...registerPassword("oldPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${
                            passwordErrors.oldPassword
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2"
                        >
                          {showOldPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.oldPassword && (
                        <p className="mt-1 text-xs text-red-500">
                          {passwordErrors.oldPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          {...registerPassword("newPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${
                            passwordErrors.newPassword
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-xs text-red-500">
                          {passwordErrors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...registerPassword("confirmPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${
                            passwordErrors.confirmPassword
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">
                          {passwordErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full text-yellow-400">
                      Đổi mật khẩu
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === "purchases" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Lịch sử mua hàng
                  </h2>

                  <div className="space-y-4">
                    {isLoadingPurchases ? (
                      <div className="flex justify-center py-10">
                        <Loading />
                      </div>
                    ) : purchases?.length ? (
                      <>
                        {purchases.map((purchase, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <Image
                                src={purchase.productId.images}
                                alt={purchase.productId.name}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {purchase.productId.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{purchase._id} •{" "}
                                  {formatDate(purchase.createdAt)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-bold text-blue-600">
                                    {formatCurrency(purchase.totalAmount)}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      purchase.status
                                    )}`}
                                  >
                                    {getStatusText(purchase.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {purchase.status === "completed" && (
                                <>
                                  {/* <Button
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Tải về
                                </Button> */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleRefundRequest(purchase)
                                    }
                                    className="flex items-center gap-2 text-yellow-400 bg-black"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                    Báo cáo
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Pagination for purchases */}
                        <div className="mt-6 flex justify-center">
                          <Pagination
                            currentPage={purchasesPage}
                            totalPages={purchasesTotalPages}
                            onPageChange={(page) => setPurchasesPage(page)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <div className="mb-4">
                          <ShoppingBag className="w-12 h-12 mx-auto text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Chưa có lịch sử mua hàng
                        </h3>
                        <p className="text-gray-500 mt-2">
                          Bạn chưa thực hiện giao dịch mua hàng nào.
                        </p>
                        <Button
                          className="mt-4 text-yellow-400"
                          onClick={() => router.push("/models")}
                        >
                          Khám phá sản phẩm
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Lịch sử nạp tiền
                  </h2>

                  <div className="space-y-4">
                    {isLoadingPayments ? (
                      <div className="flex justify-center py-10">
                        <Loading />
                      </div>
                    ) : payments?.length ? (
                      <>
                        {payments.map((payment, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 ${
                                  payment.type === "payment"
                                    ? "bg-red-100"
                                    : "bg-green-100"
                                } rounded-lg flex items-center justify-center`}
                              >
                                {payment.type === "payment" ? (
                                  <ShoppingBag className="w-6 h-6 text-red-600" />
                                ) : (
                                  <DollarSign className="w-6 h-6 text-green-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {payment.type === "payment"
                                    ? "Thanh toán đơn hàng"
                                    : payment.description}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{payment.transactionCode} •{" "}
                                  {formatDate(payment.createdAt)}
                                </p>
                                {payment.balanceAfter &&
                                  payment.balanceBefore && (
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Số dư trước giao dịch:{" "}
                                        {formatCurrency(payment.balanceBefore)}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        Số dư sau giao dịch:{" "}
                                        {formatCurrency(payment.balanceAfter)}
                                      </p>
                                    </div>
                                  )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={
                                      payment.type === "payment"
                                        ? "font-bold text-red-600"
                                        : "font-bold text-green-600"
                                    }
                                  >
                                    {payment.type === "payment" ? "-" : "+"}
                                    {formatCurrency(payment.amount)}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      payment.status
                                    )}`}
                                  >
                                    {getStatusText(payment.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* <div className="text-right">
                              <Calendar className="w-5 h-5 text-gray-400 ml-auto" />
                            </div> */}
                          </div>
                        ))}

                        {/* Pagination for payments */}
                        <div className="mt-6 flex justify-center">
                          <Pagination
                            currentPage={paymentsPage}
                            totalPages={paymentsTotalPages}
                            onPageChange={(page) => setPaymentsPage(page)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <div className="mb-4">
                          <CreditCard className="w-12 h-12 mx-auto text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Chưa có lịch sử giao dịch
                        </h3>
                        <p className="text-gray-500 mt-2">
                          Bạn chưa thực hiện giao dịch nào.
                        </p>
                        <div className="flex gap-3 justify-center mt-4">
                          <Button
                            className="text-yellow-400"
                            onClick={() => router.push("/deposit")}
                          >
                            Nạp tiền
                          </Button>
                          <Button
                            className="text-yellow-400"
                            onClick={() => router.push("/models")}
                          >
                            Mua sắm
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Yêu cầu hoàn hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    #{selectedPurchase._id}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPurchase(null);
                  setRefundReason("");
                }}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src={selectedPurchase.productId.images}
                  alt={selectedPurchase.productId.name}
                  width={50}
                  height={50}
                  className="rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedPurchase.productId.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(selectedPurchase.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mua ngày: {formatDate(selectedPurchase.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hoàn hàng *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Vui lòng mô tả lý do bạn muốn hoàn hàng..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chúng tôi sẽ xem xét yêu cầu của bạn trong vòng 24-48 giờ
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPurchase(null);
                  setRefundReason("");
                }}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleRefundSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Gửi yêu cầu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
