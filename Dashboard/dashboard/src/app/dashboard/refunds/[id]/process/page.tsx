"use client";

import { useState, useEffect } from "react";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/formatMoney";
import { toast } from "sonner";
import { RefundDetailView, RefundApprovalForm, RefundRejectionForm } from "../../components";
import { useNotifications } from "@/lib/hooks/useNotifications";

// Import RefundStatus enum from shared location
enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

interface User {
  _id: string;
  fullName?: string;
  email: string;
}

interface Refund {
  _id: string;
  userId: User;
  orderId: {
    _id: string;
    productId: {
      _id: string;
      name: string;
    };
  };
  transactionId?: string;
  amount: number;
  status: RefundStatus;
  description: string;
  images?: string[];
  adminNotes?: string;
  processedAt?: string;
  processedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export default function RefundProcessPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { refundNoti, handleMarkAsRead } = useNotifications();
  const resolvedParams = use(params);
  const [refundId] = useState<string>(resolvedParams.id);
  const [processingTab, setProcessingTab] = useState<"approve" | "reject">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch refund details
  const { data, isLoading, error } = useApiQuery<{
    data: Refund;
  }>(["refund", refundId], `/refunds/${refundId}`);

  // Mutation for updating refund status
  const { mutate: updateRefundStatus, isPending: isUpdating } = useApiMutation<
    { data: Refund },
    FormData
  >("refund", `/refunds/${refundId}`, "patch");

  const refund = data?.data;

  // Effect for redirecting if refund is not in pending state
  useEffect(() => {
    if (refund && refund.status !== RefundStatus.PENDING) {
      router.push(`/dashboard/refunds/${refundId}`);
    }
  }, [refund, refundId, router]);

  useEffect(() => {
    // Mark as read if there's a notification for this refund
    const notification = refundNoti?.find(
      (noti) => noti.originalId === refundId && !noti.isRead
    );
    
    if (notification) {
      handleMarkAsRead(notification._id);
    }
  }, [refundId, refundNoti, handleMarkAsRead]);

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleSubmitForm = async (formData: FormData) => {
    setIsProcessing(true);
    
    updateRefundStatus(formData, {
      onSuccess: () => {
        const isApproved = formData.get("status") === RefundStatus.APPROVED;
        toast.success(
          isApproved 
            ? "Yêu cầu hoàn tiền đã được chấp nhận" 
            : "Yêu cầu hoàn tiền đã bị từ chối"
        );
        
        // Redirect back to refunds list
        router.push("/dashboard/refunds");
      },
      onError: (error) => {
        toast.error(`Lỗi: ${error.message}`);
        setIsProcessing(false);
      },
      onSettled: () => {
        setIsProcessing(false);
      },
    });
  };

  if (isLoading) {
    return <PageLoading text="Đang tải thông tin yêu cầu hoàn tiền..." />;
  }

  if (error || !refund) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Không thể tải thông tin yêu cầu hoàn tiền
        </h2>
        <p className="text-gray-600 mb-6">
          Có lỗi xảy ra khi tải thông tin chi tiết. Vui lòng thử lại sau.
        </p>
        <Button onClick={() => router.push("/dashboard/refunds")}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // If refund is not in pending state, show loading while redirecting
  if (refund.status !== RefundStatus.PENDING) {
    return <PageLoading text="Đang chuyển hướng..." />;
  }

  return (
    <div className="px-4 lg:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <IconHome className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/refunds">Hoàn tiền</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/dashboard/refunds/${refundId}`}>Chi tiết</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>
        <BreadcrumbItem>
          <BreadcrumbLink>Xử lý</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Xử lý yêu cầu hoàn tiền</h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/refunds/${refundId}`)}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Quay lại chi tiết
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Refund Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu hoàn tiền</CardTitle>
          </CardHeader>
          <CardContent>
            <RefundDetailView 
              refund={refund} 
              formatDate={formatDate} 
              formatNumber={formatNumber} 
            />
          </CardContent>
        </Card>

        {/* Processing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Xử lý yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={processingTab} 
              onValueChange={(v) => setProcessingTab(v as "approve" | "reject")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">Chấp nhận</TabsTrigger>
                <TabsTrigger value="reject">Từ chối</TabsTrigger>
              </TabsList>
              
              <TabsContent value="approve" className="mt-4">
                <RefundApprovalForm
                  onSubmit={handleSubmitForm}
                  onCancel={() => router.push(`/dashboard/refunds/${refundId}`)}
                  isProcessing={isProcessing || isUpdating}
                />
              </TabsContent>
              
              <TabsContent value="reject" className="mt-4">
                <RefundRejectionForm
                  onSubmit={handleSubmitForm}
                  onCancel={() => router.push(`/dashboard/refunds/${refundId}`)}
                  isProcessing={isProcessing || isUpdating}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
