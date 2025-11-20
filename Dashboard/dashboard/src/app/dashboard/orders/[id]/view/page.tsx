"use client";

import { useParams, useRouter } from "next/navigation";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  IconHome,
  IconEdit,
  IconTrash,
  IconUser,
  IconShoppingCart,
} from "@tabler/icons-react";
import { PageLoading } from "@/components/ui/loading";
import Link from "next/link";
import { User } from "../../../users/page";
import { Product } from "@/interface/product";

interface Order {
  _id: string;
  userId: User;
  productId: Product;
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderViewPage() {
  const router = useRouter();
  const { id } = useParams();

  // Fetch order data
  const {
    data: orderData,
    isLoading,
    error,
  } = useApiQuery<{ data: Order }>(
    ["order", id as string],
    `/orders/${id}`
  );
  const order = orderData?.data;

  // Format date
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

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải thông tin đơn hàng..." />;
  }

  // Error state
  if (error || !order) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy đơn hàng"}
        </div>
      </div>
    );
  }

  // Status configuration
  const statusConfig = {
    pending: {
      label: "Chờ xử lý",
      color: "bg-yellow-500",
      variant: "secondary" as const,
    },
    processing: {
      label: "Đang xử lý",
      color: "bg-blue-500",
      variant: "default" as const,
    },
    completed: {
      label: "Hoàn thành",
      color: "bg-green-500",
      variant: "default" as const,
    },
    cancelled: {
      label: "Đã hủy",
      color: "bg-red-500",
      variant: "secondary" as const,
    },
  };

  const status = statusConfig[order.status] || statusConfig.pending;

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
          <BreadcrumbLink href="/dashboard/orders">Đơn hàng</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Chi tiết đơn hàng</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/orders/${id}`)}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm">
            <IconTrash className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                  <Badge
                    variant={status.variant}
                    className={`${status.color} mt-1`}
                  >
                    {status.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-mono text-xs break-all">{order._id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                  <p className="font-semibold">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <p className="font-semibold">
                    {formatDate(order.updatedAt)}
                  </p>
                </div>

                {order.paymentMethod && (
                  <div>
                    <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                    <p className="font-semibold capitalize">{order.paymentMethod}</p>
                  </div>
                )}

                {order.transactionId && (
                  <div>
                    <p className="text-sm text-gray-500">Mã giao dịch</p>
                    <p className="font-mono text-xs break-all">{order.transactionId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <IconUser className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tên khách hàng</p>
                      <Link 
                        href={`/dashboard/users/${order.userId._id}`} 
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {order.userId.fullName || "Không có tên"}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{order.userId.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID Khách hàng</p>
                      <p className="font-mono text-xs break-all">{order.userId._id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <IconShoppingCart className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tên sản phẩm</p>
                      <Link 
                        href={`/dashboard/products/${order.productId._id}`} 
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {order.productId.name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Danh mục</p>
                      <p className="font-semibold">{order.productId.categoryName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID Sản phẩm</p>
                      <p className="font-mono text-xs break-all">{order.productId._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Giá</p>
                      <p className="font-semibold">{order.totalAmount} coin</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/orders")}
            >
              Quay lại
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/orders/${id}`)}
            >
              Chỉnh sửa đơn hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}