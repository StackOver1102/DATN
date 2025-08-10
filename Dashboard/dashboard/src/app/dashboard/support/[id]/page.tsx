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
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome, IconHeadset } from "@tabler/icons-react";
import { PageLoading, Loading } from "@/components/ui/loading";
import { toast } from "sonner";
import { User } from "../../users/page";

interface Support {
  _id: string;
  userId: User;
  title: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  images?: string[];
  attachments?: string[];
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  message: string;
  name?: string;
  email?: string; 
  phone?: string;
}

export default function SupportEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);

  // State for form
  const [formData, setFormData] = useState<{
    status: "resolved" | "rejected";
    response: string;
  }>({
    status: "resolved",
    response: "",
  });

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch support data
  const {
    data: supportData,
    isLoading,
    error,
  } = useApiQuery<{ data: Support }>(
    ["support", id as string],
    `/support/${id}`
  );

  // Update mutation
  const { mutate: updateSupport, isPending: isUpdating } = useApiMutation<
    { data: Support },
    { status: "resolved" | "rejected"; response: string }
  >("support", `/support/${id}`, "patch");

  // Set form data when support data is loaded
  useEffect(() => {
    if (supportData?.data?.adminResponse) {
      setFormData(prev => ({
        ...prev,
        response: supportData.data.adminResponse || ""
      }));
    }
  }, [supportData]);

  // Handle status change
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as "resolved" | "rejected"
    }));
  };

  // Handle response change
  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      response: e.target.value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.response.trim()) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }

    updateSupport(
      { 
        status: formData.status,
        response: formData.response
      },
      {
        onSuccess: () => {
          toast.success(`Yêu cầu hỗ trợ đã được ${formData.status === "resolved" ? "giải quyết" : "từ chối"}`);
          router.push("/dashboard/support");
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
    return <PageLoading text="Đang tải thông tin yêu cầu hỗ trợ..." />;
  }

  // Error state
  if (error || !supportData?.data) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy yêu cầu hỗ trợ"}
        </div>
      </div>
    );
  }

  const support = supportData.data;

  // Check if support request is already processed
  if (support.status !== "pending") {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <h2 className="text-xl font-semibold">Yêu cầu hỗ trợ này đã được xử lý</h2>
          <p className="text-gray-500">Trạng thái hiện tại: {support.status === "resolved" ? "Đã giải quyết" : "Đã từ chối"}</p>
          <Button onClick={() => router.push(`/dashboard/support/${id}/view`)}>
            Xem chi tiết
          </Button>
        </div>
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
          <BreadcrumbLink href="/dashboard/support">Hỗ trợ</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Xử lý yêu cầu</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Xử lý yêu cầu hỗ trợ</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/support")}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Đang lưu..." : "Lưu phản hồi"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Mã yêu cầu</Label>
                  <p className="font-mono text-xs break-all">{support._id}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Người gửi</Label>
                  <p className="font-medium">{support.name || "Không có tên"}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="font-medium">{support.email}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Số điện thoại</Label>
                  <p className="font-medium">{support.phone}</p>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Ngày gửi</Label>
                  <p className="font-medium">
                    {new Date(support.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Nội dung yêu cầu</Label>
                  <p className="font-medium whitespace-pre-line">{support.message}</p>
                </div>

                <div className="mb-4">
                  <Label htmlFor="status" className="block mb-2">Trạng thái xử lý</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Giải quyết</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="response" className="block mb-2">
                Phản hồi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="response"
                placeholder="Nhập phản hồi cho yêu cầu này..."
                value={formData.response}
                onChange={handleResponseChange}
                rows={6}
                className="w-full"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/support/${id}/view`)}
          >
            Xem chi tiết
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/support")}
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
              "Lưu phản hồi"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}