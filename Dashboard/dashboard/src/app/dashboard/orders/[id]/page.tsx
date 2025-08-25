"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome } from "@tabler/icons-react";
import { PageLoading, Loading } from "@/components/ui/loading";
import { toast } from "sonner";
import Link from "next/link";
import { User } from "../../users/page";
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

export default function OrderEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  
  // State for form
  const [formData, setFormData] = useState<Partial<Order>>({
    status: "cancelled",
  });

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch order data
  const {
    data: orderData,
    isLoading,
    error,
  } = useApiQuery<{ data: Order }>(
    ["order", id as string],
    `/orders/${id}`,
  );

  // Update mutation
  const { mutate: updateOrder, isPending: isUpdating } = useApiMutation<
    { data: Order },
    Partial<Order>
  >("orders", `/orders/${id}`, "patch");

  // Set form data when order data is loaded
  useEffect(() => {
    if (orderData?.data) {
      setFormData(orderData.data);
    }
  }, [orderData]);

  // Handle status change
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      status: value as "pending" | "processing" | "completed" | "cancelled" 
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateOrder(
      { status: formData.status || "cancelled" },
      {
        onSuccess: () => {
          toast.success("Đơn hàng đã được cập nhật thành công");
          router.push("/dashboard/orders");
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải thông tin đơn hàng..." />;
  }

  // Error state
  if (error || !orderData?.data) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy đơn hàng"}
        </div>
      </div>
    );
  }

  const order = orderData.data;

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
          <BreadcrumbLink>Chỉnh sửa đơn hàng</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa đơn hàng</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders")}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Mã đơn hàng</Label>
                  <p className="font-mono text-xs break-all">{order._id}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Khách hàng</Label>
                  <Link 
                    href={`/dashboard/users/${order?.userId?._id}`} 
                    className="block font-semibold text-blue-600 hover:underline"
                  >
                    {order.userId?.fullName || order.userId?.email}
                  </Link>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Sản phẩm</Label>
                  <Link 
                    href={`/dashboard/products/${order?.productId?._id}`} 
                    className="block font-semibold text-blue-600 hover:underline"
                  >
                    {order.productId.name}
                  </Link>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Giá trị đơn hàng</Label>
                  <p className="font-semibold">{order?.totalAmount} coin</p>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Ngày đặt hàng</Label>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {order.paymentMethod && (
                  <div className="mb-4">
                    <Label className="text-sm text-gray-500">Phương thức thanh toán</Label>
                    <p className="font-semibold capitalize">{order.paymentMethod}</p>
                  </div>
                )}

                {order.transactionId && (
                  <div className="mb-4">
                    <Label className="text-sm text-gray-500">Mã giao dịch</Label>
                    <p className="font-mono text-xs break-all">{order.transactionId}</p>
                  </div>
                )}

                <div className="mb-4">
                  <Label htmlFor="status" className="block mb-2">Trạng thái đơn hàng</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/orders/${id}/view`)}
          >
            Xem chi tiết
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders")}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <div className="flex items-center">
                <Loading size="sm" variant="spinner" className="mr-2" />
                Đang lưu...
              </div>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}