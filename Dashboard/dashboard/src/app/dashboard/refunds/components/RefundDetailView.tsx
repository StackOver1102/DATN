"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconClock, IconCheck, IconCoin, IconX, IconPhoto } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

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
  imagesByAdmin?: string[];
  attachments?: string[];
  adminNotes?: string;
  processedAt?: string;
  processedBy?: User;
  createdAt: string;
  updatedAt: string;
}

interface RefundDetailViewProps {
  refund: Refund;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
}

export default function RefundDetailView({
  refund,
  formatDate,
  formatNumber,
}: RefundDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              {(() => {
                const status = refund.status;
                switch (status) {
                  case RefundStatus.PENDING:
                    return (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit"
                      >
                        <IconClock className="h-3 w-3" /> Chờ xử lý
                      </Badge>
                    );
                  case RefundStatus.APPROVED:
                    return (
                      <Badge
                        variant="default"
                        className="bg-blue-500 flex items-center gap-1 w-fit"
                      >
                        <IconCheck className="h-3 w-3" /> Đã duyệt
                      </Badge>
                    );
                  case RefundStatus.COMPLETED:
                    return (
                      <Badge
                        variant="success"
                        className="flex items-center gap-1 w-fit"
                      >
                        <IconCoin className="h-3 w-3" /> Đã hoàn tiền
                      </Badge>
                    );
                  case RefundStatus.REJECTED:
                    return (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 w-fit"
                      >
                        <IconX className="h-3 w-3" /> Từ chối
                      </Badge>
                    );
                  default:
                    return status;
                }
              })()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Mã yêu cầu</p>
              <p className="font-mono text-xs break-all">
                {refund._id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số tiền hoàn trả</p>
              <p className="font-semibold text-green-600">
                {formatNumber(refund.amount)} coin
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày yêu cầu</p>
              <p className="font-medium">
                {formatDate(refund.createdAt)}
              </p>
            </div>
            {refund.processedAt && (
              <div>
                <p className="text-sm text-gray-500">Ngày xử lý</p>
                <p className="font-medium">
                  {formatDate(refund.processedAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Thông tin người dùng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <Link
                href={`/dashboard/users/${refund.userId._id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {refund.userId.fullName ||
                  refund.userId.email}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">
                {refund.userId.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID khách hàng</p>
              <p className="font-mono text-xs break-all">
                {refund.userId._id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Đơn hàng</p>
              <Link
                href={`/dashboard/orders/${refund.orderId._id}/view`}
                className="text-blue-600 hover:underline font-medium"
              >
                {refund.orderId.productId?.name ||
                  refund.orderId._id}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description and Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mô tả yêu cầu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">
            {refund.description}
          </p>
        </CardContent>
      </Card>

      {/* Admin Notes if available */}
      {refund.adminNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Ghi chú của Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">
              {refund.adminNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Images if available */}
      {refund.images && refund.images.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Hình ảnh đính kèm từ người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {refund.images.map((image, index) => (
                <div
                  key={index}
                  className="relative h-48 border rounded-md overflow-hidden"
                >
                  <Image
                    src={image}
                    alt={`Hình ảnh ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <a
                    href={image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <IconPhoto className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Images if available */}
      {refund.imagesByAdmin && refund.imagesByAdmin.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Hình ảnh phản hồi từ Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {refund.imagesByAdmin.map((image, index) => (
                <div
                  key={index}
                  className="relative h-48 border rounded-md overflow-hidden"
                >
                  <Image
                    src={image}
                    alt={`Hình ảnh Admin ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <a
                    href={image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <IconPhoto className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Attachments if available */}
      {refund.attachments && refund.attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Tệp đính kèm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {refund.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative h-48 border rounded-md overflow-hidden"
                >
                  <Image
                    src={attachment}
                    alt={`Tệp đính kèm ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <IconPhoto className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
