"use client";

import { useState, useEffect } from "react";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { IconHome, IconArrowLeft, IconEdit } from "@tabler/icons-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { use } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/formatMoney";
import { RefundDetailView } from "../components";
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

export default function RefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { refundNoti, handleMarkAsRead } = useNotifications();
  const resolvedParams = use(params);
  const [refundId] = useState<string>(resolvedParams.id);

  // Fetch refund details
  const { data, isLoading, error } = useApiQuery<{
    data: Refund;
  }>(["refund", refundId], `/refunds/${refundId}`);

  const refund = data?.data;

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
          <BreadcrumbLink>Chi tiết</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi tiết yêu cầu hoàn tiền</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/refunds")}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          
          {refund.status === RefundStatus.PENDING && (
            <Button 
              onClick={() => router.push(`/dashboard/refunds/${refundId}/process`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <IconEdit className="mr-2 h-4 w-4" />
              Xử lý yêu cầu
            </Button>
          )}
        </div>
      </div>

      <RefundDetailView 
        refund={refund} 
        formatDate={formatDate} 
        formatNumber={formatNumber} 
      />
      
      <div className="mt-8 flex justify-end">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/refunds")}
        >
          Quay lại danh sách
        </Button>
      </div>
    </div>
  );
}
