"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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
  Upload,
  Camera,
  CircleDollarSign,
  Bell,
  RefreshCcw,
  LifeBuoy,
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
import { User, Notification } from "@/lib/types";
import { Product } from "@/interface/product";
import Pagination from "@/components/Pagination";
import { PaginatedResult } from "@/interface/pagination";
import { Session } from "next-auth";
import { getMatchingNotification } from "@/utils/notificationHelper";

type TabType = "info" | "password" | "purchases" | "payments" | "refunds" | "support";

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
  notificationId?: string;
  isRead?: boolean;
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
  notificationId?: string;
  isRead?: boolean;
}

interface RefundRequest {
  _id: string;
  orderId: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  order?: Purchase;
  notificationId?: string;
  isRead?: boolean;
}

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
  isRead?: boolean;
}

// Schema validation for user profile form
const userProfileSchema = z.object({
  fullName: z.string().min(2, "Name must have at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Schema validation for password change form
const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, "Password must have at least 6 characters"),
    newPassword: z.string().min(6, "New password must have at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must have at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
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
      tabParam === "password" ||
      tabParam === "refunds" ||
      tabParam === "support"
      ? (tabParam as TabType)
      : "info"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [refundReason, setRefundReason] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refund notification states
  const [pendingRefunds, setPendingRefunds] = useState(0);
  const [hasNewRefundUpdates, setHasNewRefundUpdates] = useState(false);

  // Pagination states
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [refundsPage, setRefundsPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const itemsPerPage = 5;

  const { data: purchasesData, isLoading: isLoadingPurchases } = useFetchData<
    PaginatedResult<Purchase>
  >(
    `orders/my-orders?page=${purchasesPage}&limit=${itemsPerPage}`,
    ["purchases", purchasesPage.toString()],
    // {
    //   enabled: activeTab === "purchases",
    // }
  );

    const { data: paymentsData, isLoading: isLoadingPayments } = useFetchData<
    PaginatedResult<Payment>
  >(
    `transactions/my-transactions?page=${paymentsPage}&limit=${itemsPerPage}`,
    ["transactions", paymentsPage.toString()],
    // {
    //   enabled: activeTab === "payments",
    // }
  );
  
  // Fetch refund requests
  const { data: refundsData, isLoading: isLoadingRefundRequests } = useFetchData<
    PaginatedResult<RefundRequest>
  >(
    `refunds/my-refunds?page=${refundsPage}&limit=${itemsPerPage}`,
    ["refunds", refundsPage.toString()],
    {
      enabled: activeTab === "refunds",
    }
  );
  
  // Fetch support tickets
  const { data: supportData, isLoading: isLoadingSupportTickets } = useFetchData<
    PaginatedResult<SupportTicket>
  >(
    `support/my-tickets?page=${supportPage}&limit=${itemsPerPage}`,
    ["support", supportPage.toString()],
    {
      enabled: activeTab === "support",
    }
  );
  
  // Fetch all notifications
  const { data: notificationData, isLoading: isLoadingNotifications, refetch: refetchNotifications } = useFetchData<Notification[]>(
    `notifications/byUser`,
    ["notifications"],
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );
  
  // Extract data from paginated responses
  const purchases = purchasesData?.items || [];
  const purchasesTotalPages = purchasesData?.meta.totalPages || 1;

  const payments = paymentsData?.items || [];
  const paymentsTotalPages = paymentsData?.meta.totalPages || 1;
  
  const refunds = refundsData?.items || [];
  const refundsTotalPages = refundsData?.meta.totalPages || 1;
  
  const supportTickets = supportData?.items || [];
  const supportTotalPages = supportData?.meta.totalPages || 1;
  
  // Extract notifications
  const notifications = notificationData || [];

  const { post, patch } = useApi();

  // Function to handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowAvatarModal(true);
    }
  };

  // Function to upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !session?.user?.id) return;

    try {
      setIsUploadingAvatar(true);

      // Create form data
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      // Upload avatar
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Update user data with new avatar URL
        setUserData({
          ...userData,
          avatar: data.data.avatar,
        });

        // Update Redux store
        if (profile) {
          dispatch(setProfile({
            ...profile,
            avatar: data.data.avatar,
          }));
        }

        toast.success("Avatar updated successfully!");
        setShowAvatarModal(false);
      } else {
        toast.error(data.message || "Failed to update avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("An error occurred while uploading avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
        totalDownloads: purchasesData?.items.length || 0,
      });

      // if(purchasesData?.items.length) {
      //   setUserData({
      //     ...userData,
      //     totalDownloads: purchasesData?.items.length || 0,
      //   });
      // }

      // Update form values
      setProfileValue("fullName", profile.fullName || "");
      setProfileValue("email", profile.email || "");
      setProfileValue("phone", profile.phone || "");
      setProfileValue("address", profile.address || "");
    }
  }, [profile, setProfileValue, purchasesData]);

  // Update refund notification states when notification data changes
  useEffect(() => {
    if (notifications) {
      setPendingRefunds(notifications.length || 0);
      setHasNewRefundUpdates(notifications.length > 0 || false);
    }
  }, [notifications]);

  // Calculate notification counts for each tab
  const getTabNotificationCount = (type: 'refund' | 'support') => {
    // console.log(notifications);
    if (!notifications || notifications.length === 0) return 0;
    return notifications.filter(notification => 
      notification.originType === type && !notification.isWatching
    ).length;
  };

  const refundNotificationCount = getTabNotificationCount('refund');
  const supportNotificationCount = getTabNotificationCount('support');

  const tabs = [
    {
      id: "info" as TabType,
      label: "Personal Information",
      icon: UserIcon,
      notifications: 0,
      hasUpdates: false
    },
    {
      id: "password" as TabType,
      label: "Change Password",
      icon: Lock,
      notifications: 0,
      hasUpdates: false
    },
    {
      id: "purchases" as TabType,
      label: "Purchase History",
      icon: ShoppingBag,
      notifications: 0,
      hasUpdates: false
    },
    {
      id: "payments" as TabType,
      label: "Payment History",
      icon: CreditCard,
      notifications: 0,
      hasUpdates: false
    },
    {
      id: "refunds" as TabType,
      label: "Refund Requests",
      icon: RefreshCcw,
      notifications: refundNotificationCount,
      hasUpdates: refundNotificationCount > 0
    },
    {
      id: "support" as TabType,
      label: "Support Tickets",
      icon: LifeBuoy,
      notifications: supportNotificationCount,
      hasUpdates: supportNotificationCount > 0
    },
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
        toast.success("Information updated successfully!");
      }
    } catch (error) {
      toast.error(
        `An error occurred while updating information: ${error instanceof Error ? error.message : "Unknown error"
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
      toast.success("Password changed successfully!");
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
      alert("Please enter a reason for the refund request!");
      return;
    }

    try {
      // Handle refund request submission
      const response = await post(`refunds`, {
        description: refundReason,
        orderId: selectedPurchase?._id,
      });

      if (response.success) {
        // Close modal and reset

        toast.success(
          "Refund request submitted! We will process it within 24-48 hours."
        );
      }
      else {

        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error submitting refund request:", error);
      toast.error("An error occurred while submitting the refund request!");
    } finally {
      setShowRefundModal(false);
      setSelectedPurchase(null);
      setRefundReason("");
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
        return "Completed";
      case "pending":
        return "Processing";
      case "failed":
        return "Failed";
      case "refunded":
        return "Refunded";
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

  const formatNumber = (number: number) => {
    return number.toLocaleString("vi-VN");
  };
  
  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await patch(`notifications/mark-as-watching/${notificationId}`, {});
      if (response.success) {
        // Refresh notification data and transaction/purchase lists
        refetchNotifications();
        
        // Show subtle toast notification
        toast.success("Notification marked as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  if (isLoadingPurchases || isLoadingPayments || isLoadingStore || isLoadingNotifications ||
      (activeTab === "refunds" && isLoadingRefundRequests) || 
      (activeTab === "support" && isLoadingSupportTickets)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading variant="spinner" size="lg" text="Loading information..." />
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
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userData.fullName}
                </h1>
                <p className="text-gray-600 mb-4">{userData.email}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      <span className="flex items-center">
                        {formatNumber(userData.balance)}
                        <CircleDollarSign className="w-4 h-4 text-yellow-500 ml-1 mt-[1px]" />
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Available Balance</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {userData.totalDownloads}
                    </div>
                    <div className="text-sm text-gray-600">Downloads</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatDate(userData.joinDate)}
                    </div>
                    <div className="text-sm text-gray-600">Join Date</div>
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
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        } relative`}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {tab.notifications > 0 && (
                          <div className="absolute -top-2 -right-2 flex items-center justify-center">
                            <div className="relative">
                              <Bell className="w-3 h-3 text-yellow-500" fill={tab.hasUpdates ? "#eab308" : "none"} />
                              <span className="absolute top-0 right-0 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                {/* <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span> */}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <span>{tab.label}</span>
                      {tab.notifications > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          {tab.notifications}
                        </span>
                      )}
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
                      Personal Information
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
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                  </div>

                  <form
                    onSubmit={handleSubmitProfile(onSubmitProfile)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        {...registerProfile("fullName")}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border ${profileErrors.fullName
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
                        className={`w-full px-4 py-3 border ${profileErrors.email
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
                        Phone Number
                      </label>
                      <input
                        {...registerProfile("phone")}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border ${profileErrors.phone
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
                        Address
                      </label>
                      <textarea
                        {...registerProfile("address")}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-4 py-3 border ${profileErrors.address
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
                    Change Password
                  </h2>

                  <form
                    onSubmit={handleSubmitPassword(onSubmitPassword)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          {...registerPassword("oldPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${passwordErrors.oldPassword
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
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          {...registerPassword("newPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${passwordErrors.newPassword
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
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...registerPassword("confirmPassword")}
                          className={`w-full px-4 py-3 pr-12 border ${passwordErrors.confirmPassword
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
                      Change Password
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === "purchases" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Purchase History
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
                            className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between
                              ${purchase.notificationId && !purchase.isRead 
                                ? "border-l-4 border-yellow-400" 
                                : ""
                              }
                              ${purchase.notificationId 
                                ? "cursor-pointer transform transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-md" 
                                : ""
                              }`}
                            onClick={() => {
                              if (purchase.notificationId ) {
                                markNotificationAsRead(purchase.notificationId);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Image
                                  src={purchase.productId.images}
                                  alt={purchase.productId.name}
                                  width={60}
                                  height={60}
                                  className="rounded-lg object-cover"
                                />
                                {purchase.notificationId && !purchase.isRead && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {purchase.productId.name}
                                  {purchase.notificationId && !purchase.isRead && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
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
                            <div className="flex gap-2 items-center">
                              {purchase.notificationId && !purchase.isRead && (
                                <Bell className="w-5 h-5 text-yellow-500 mr-2" fill="#eab308" />
                              )}
                              {purchase.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the parent onClick
                                    handleRefundRequest(purchase);
                                  }}
                                  className="flex items-center gap-2 text-yellow-400 bg-black"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Report
                                </Button>
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
                          No purchase history
                        </h3>
                        <p className="text-gray-500 mt-2">
                          You haven&apos;t made any purchases yet.
                        </p>
                        <Button
                          className="mt-4 text-yellow-400"
                          onClick={() => router.push("/models")}
                        >
                          Explore Products
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Payment History
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
                            className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between 
                              ${payment.notificationId && !payment.isRead 
                                ? "border-l-4 border-yellow-400" 
                                : ""
                              }
                              ${payment.notificationId 
                                ? "cursor-pointer transform transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-md" 
                                : ""
                              }`}
                            onClick={() => {
                              if (payment.notificationId && !payment.isRead) {
                                markNotificationAsRead(payment.notificationId);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 ${payment.type === "payment"
                                  ? "bg-red-100"
                                  : "bg-green-100"
                                  } rounded-lg flex items-center justify-center relative`}
                              >
                                {payment.type === "payment" ? (
                                  <ShoppingBag className="w-6 h-6 text-red-600" />
                                ) : (
                                  <DollarSign className="w-6 h-6 text-green-600" />
                                )}
                                {payment.notificationId && !payment.isRead && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {payment.type === "payment"
                                    ? "Order Payment"
                                    : payment.description}
                                  {payment.notificationId && !payment.isRead && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{payment.transactionCode} •{" "}
                                  {formatDate(payment.createdAt)}
                                </p>
                                {payment.balanceAfter &&
                                  payment.balanceBefore && (
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Balance before transaction:{" "}
                                        {formatNumber(payment.balanceBefore)}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        Balance after transaction:{" "}
                                        {formatNumber(payment.balanceAfter)}
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
                                    {formatNumber(payment.amount)}
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
                            {payment.notificationId && !payment.isRead && (
                              <div className="text-right">
                                <Bell className="w-5 h-5 text-yellow-500" fill="#eab308" />
                              </div>
                            )}
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
                          No transaction history
                        </h3>
                        <p className="text-gray-500 mt-2">
                          You haven&apos;t made any transactions yet.
                        </p>
                        <div className="flex gap-3 justify-center mt-4">
                          <Button
                            className="text-yellow-400"
                            onClick={() => router.push("/deposit")}
                          >
                            Deposit
                          </Button>
                          <Button
                            className="text-yellow-400"
                            onClick={() => router.push("/models")}
                          >
                            Shop
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "refunds" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Refund Requests
                  </h2>

                  <div className="space-y-4">
                    {isLoadingRefundRequests ? (
                      <div className="flex justify-center py-10">
                        <Loading />
                      </div>
                    ) : refunds?.length ? (
                      <>
                        {refunds.map((refund, index) => {
                          const matchingNotification = getMatchingNotification(notifications, refund._id, 'refund');
                          const hasNotification = !!matchingNotification;
                          const isUnread = matchingNotification && !matchingNotification.isWatching;
                          
                          return (
                          <div
                            key={index}
                            className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between
                              ${isUnread 
                                ? "border-l-4 border-yellow-400" 
                                : ""
                              }
                              ${hasNotification 
                                ? "cursor-pointer transform transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-md" 
                                : ""
                              }`}
                            onClick={() => {
                              if (matchingNotification && !matchingNotification.isWatching) {
                                markNotificationAsRead(matchingNotification._id);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center relative
                                ${refund.status === "pending" ? "bg-yellow-100" : 
                                  refund.status === "approved" ? "bg-green-100" : "bg-red-100"}`}
                              >
                                <RefreshCcw className={`w-6 h-6 
                                  ${refund.status === "pending" ? "text-yellow-600" : 
                                    refund.status === "approved" ? "text-green-600" : "text-red-600"}`} 
                                />
                                {isUnread && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  Refund Request {refund.order && `for ${refund.order.productId.name}`}
                                  {isUnread && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{refund._id} • {formatDate(refund.createdAt)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {refund.description.length > 80 
                                    ? refund.description.substring(0, 80) + "..." 
                                    : refund.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium 
                                      ${refund.status === "pending" 
                                        ? "text-yellow-600 bg-yellow-100" 
                                        : refund.status === "approved" 
                                          ? "text-green-600 bg-green-100" 
                                          : "text-red-600 bg-red-100"
                                      }`}
                                  >
                                    {refund.status === "pending" 
                                      ? "Pending" 
                                      : refund.status === "approved" 
                                        ? "Approved" 
                                        : "Rejected"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isUnread && (
                              <div className="text-right">
                                <Bell className="w-5 h-5 text-yellow-500" fill="#eab308" />
                              </div>
                            )}
                          </div>
                          );
                        })}

                        {/* Pagination for refunds */}
                        <div className="mt-6 flex justify-center">
                          <Pagination
                            currentPage={refundsPage}
                            totalPages={refundsTotalPages}
                            onPageChange={(page) => setRefundsPage(page)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <div className="mb-4">
                          <RefreshCcw className="w-12 h-12 mx-auto text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          No refund requests
                        </h3>
                        <p className="text-gray-500 mt-2">
                          You haven&apos;t made any refund requests yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "support" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Support Tickets
                    </h2>
                    <Button
                      onClick={() => router.push("/support")}
                      className="flex items-center gap-2 text-yellow-400"
                    >
                      <LifeBuoy className="w-4 h-4" />
                      New Ticket
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {isLoadingSupportTickets ? (
                      <div className="flex justify-center py-10">
                        <Loading />
                      </div>
                    ) : supportTickets?.length ? (
                      <>
                        {supportTickets.map((ticket, index) => {
                          const matchingNotification = getMatchingNotification(notifications, ticket._id, 'support');
                          const hasNotification = !!matchingNotification;
                          const isUnread = matchingNotification && !matchingNotification.isRead;
                          
                          return (
                          <div
                            key={index}
                            className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between
                              ${isUnread 
                                ? "border-l-4 border-yellow-400" 
                                : ""
                              }
                              ${hasNotification 
                                ? "cursor-pointer transform transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-md" 
                                : ""
                              }`}
                            onClick={() => {
                              if (matchingNotification && !matchingNotification.isRead) {
                                markNotificationAsRead(matchingNotification._id);
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center relative
                                ${ticket.status === "open" ? "bg-blue-100" : 
                                  ticket.status === "in_progress" ? "bg-yellow-100" : "bg-green-100"}`}
                              >
                                <LifeBuoy className={`w-6 h-6 
                                  ${ticket.status === "open" ? "text-blue-600" : 
                                    ticket.status === "in_progress" ? "text-yellow-600" : "text-green-600"}`} 
                                />
                                {isUnread && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {ticket.subject}
                                  {isUnread && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  #{ticket._id} • {formatDate(ticket.createdAt)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {ticket.message.length > 80 
                                    ? ticket.message.substring(0, 80) + "..." 
                                    : ticket.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium 
                                      ${ticket.status === "open" 
                                        ? "text-blue-600 bg-blue-100" 
                                        : ticket.status === "in_progress" 
                                          ? "text-yellow-600 bg-yellow-100" 
                                          : "text-green-600 bg-green-100"
                                      }`}
                                  >
                                    {ticket.status === "open" 
                                      ? "Open" 
                                      : ticket.status === "in_progress" 
                                        ? "In Progress" 
                                        : "Closed"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isUnread && (
                              <div className="text-right">
                                <Bell className="w-5 h-5 text-yellow-500" fill="#eab308" />
                              </div>
                            )}
                          </div>
                          );
                        })}

                        {/* Pagination for support tickets */}
                        <div className="mt-6 flex justify-center">
                          <Pagination
                            currentPage={supportPage}
                            totalPages={supportTotalPages}
                            onPageChange={(page) => setSupportPage(page)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <div className="mb-4">
                          <LifeBuoy className="w-12 h-12 mx-auto text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          No support tickets
                        </h3>
                        <p className="text-gray-500 mt-2">
                          You haven&apos;t created any support tickets yet.
                        </p>
                        <Button
                          className="mt-4 text-yellow-400"
                          onClick={() => router.push("/support")}
                        >
                          Create Support Ticket
                        </Button>
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
                    Refund Request
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
                    Purchase date: {formatDate(selectedPurchase.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for refund *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please describe why you want a refund..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                We will review your request within 24-48 hours
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
                Cancel
              </Button>
              <Button
                onClick={handleRefundSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarModal && avatarPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Update Profile Picture
                  </h3>
                  <p className="text-sm text-gray-500">
                    Preview and confirm your new profile picture
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <Image
                  src={avatarPreview}
                  alt="Avatar Preview"
                  fill
                  className="rounded-full object-cover border-4 border-blue-100"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                className="flex-1"
                disabled={isUploadingAvatar}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAvatarUpload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
