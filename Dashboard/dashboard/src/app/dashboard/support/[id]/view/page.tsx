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
  IconHeadset,
  IconMail,
  IconPhone,
  IconPhoto,
  IconCalendar,
  IconUser,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import { PageLoading } from "@/components/ui/loading";
import { User } from "../../../users/page";
import Image from "next/image";

interface Support {
  _id: string;
  userId: User;
  title: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  images?: string[];
  imagesByAdmin?: string[];
  attachments?: string[];
  response?: string;
  createdAt: string;
  updatedAt: string;
  message: string;
  name?: string;
  email?: string; 
  phone?: string;
  processedAt?: string;
  processedBy?: {
    _id: string;
    fullName?: string;
    email: string;
  };
}

export default function SupportViewPage() {
  const router = useRouter();
  const { id } = useParams();

  // Fetch support data
  const {
    data: supportData,
    isLoading,
    error,
  } = useApiQuery<{ data: Support }>(
    ["support", id as string],
    `/support/${id}`
  );
  
  const support = supportData?.data;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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
    return <PageLoading text="Đang tải thông tin yêu cầu hỗ trợ..." />;
  }

  // Error state
  if (error || !support) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy yêu cầu hỗ trợ"}
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
      icon: IconClock,
    },
    resolved: {
      label: "Đã giải quyết",
      color: "bg-green-500",
      variant: "default" as const,
      icon: IconCheck,
    },
    rejected: {
      label: "Từ chối",
      color: "bg-red-500",
      variant: "destructive" as const,
      icon: IconX,
    },
  };

  const status = statusConfig[support.status as keyof typeof statusConfig] || statusConfig.pending;

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
          <BreadcrumbLink>Chi tiết yêu cầu</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi tiết yêu cầu hỗ trợ</h1>
        <div className="flex gap-2">
          {support.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/support/${id}`)}
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Xử lý
            </Button>
          )}
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
              <CardTitle className="text-lg">Thông tin yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Trạng thái hiện tại</p>
                  <Badge
                    variant={status.variant}
                    className={`${status.color} mt-1 flex items-center gap-1`}
                  >
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mã yêu cầu</p>
                  <p className="font-mono text-xs break-all">{support._id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ngày gửi</p>
                  <p className="font-semibold">
                    {formatDate(support.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <p className="font-semibold">
                    {formatDate(support.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thông tin người gửi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <IconHeadset className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tên người gửi</p>
                      <p className="font-semibold">{support.name || "Không có tên"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-gray-500" />
                      <p className="font-semibold">{support.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-gray-500" />
                      <p className="font-semibold">{support.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Nội dung yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{support.message}</p>
            </CardContent>
          </Card>

          {/* Admin Response Section */}
          {(support.status === "resolved" || support.status === "rejected") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Phản hồi của Admin
                  {support.status === "resolved" && (
                    <Badge variant="success" className="ml-2">
                      <IconCheck className="h-3 w-3 mr-1" /> Đã giải quyết
                    </Badge>
                  )}
                  {support.status === "rejected" && (
                    <Badge variant="destructive" className="ml-2">
                      <IconX className="h-3 w-3 mr-1" /> Đã từ chối
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {support.response && (
                    <div>
                      <p className="whitespace-pre-line">{support.response}</p>
                    </div>
                  )}
                  
                  {/* Admin info and processed time */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      {support.processedBy && (
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <IconUser className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Xử lý bởi</p>
                            <p className="font-medium">
                              {support.processedBy.fullName || support.processedBy.email}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {support.processedAt && (
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100 p-2 rounded-full">
                            <IconCalendar className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Thời gian xử lý</p>
                            <p className="font-medium">{formatDate(support.processedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Attachments if available */}
          {support.attachments && support.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tệp đính kèm từ người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {support.attachments.map((attachment, index) => (
                    <div key={index} className="relative h-48 border rounded-md overflow-hidden">
                      {attachment.toLowerCase().endsWith('.jpg') || 
                       attachment.toLowerCase().endsWith('.jpeg') || 
                       attachment.toLowerCase().endsWith('.png') || 
                       attachment.toLowerCase().endsWith('.gif') ? (
                        <Image
                          src={attachment}
                          alt={`Hình ảnh ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <div className="text-center">
                            <IconPhoto className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500 mt-2">Tệp đính kèm</p>
                          </div>
                        </div>
                      )}
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
          
          {/* Admin Attachments if available */}
          {support.imagesByAdmin && support.imagesByAdmin.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Hình ảnh phản hồi từ Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {support.imagesByAdmin.map((image, index) => (
                    <div key={index} className="relative h-48 border rounded-md overflow-hidden">
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

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/support")}
            >
              Quay lại
            </Button>
            {support.status === "pending" && (
              <Button
                onClick={() => router.push(`/dashboard/support/${id}`)}
              >
                Xử lý yêu cầu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}