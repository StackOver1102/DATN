"use client";

import { useRouter, useParams } from "next/navigation";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconArrowLeft, IconEdit, IconEye } from "@tabler/icons-react";
import { PageLoading } from "@/components/ui/loading";

interface Modal {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ViewModalPage() {
  const router = useRouter();
  const params = useParams();
  const modalId = params.id as string;

  const { data: modal, isLoading, error } = useApiQuery<Modal>(
    ["initmodal", modalId],
    `/initmodal/${modalId}`
  );

  if (isLoading) {
    return <PageLoading text="Đang tải thông tin modal..." />;
  }

  if (error || !modal) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Lỗi khi tải dữ liệu
          </div>
          <div className="text-muted-foreground">
            {error?.message || "Không tìm thấy modal"}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/modal")}
            className="mt-4"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <IconArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết Modal</h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/modal/${modalId}`)}
          className="flex items-center gap-2"
        >
          <IconEdit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconEye className="h-5 w-5" />
              Thông tin Modal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  ID
                </label>
                <div className="mt-1 font-mono text-sm">{modal._id}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </label>
                <div className="mt-1">
                  <Badge
                    variant={modal.isActive ? "default" : "secondary"}
                    className={modal.isActive ? "bg-green-500" : "bg-gray-500"}
                  >
                    {modal.isActive ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tiêu đề
              </label>
              <div className="mt-1 text-lg font-semibold">{modal.title}</div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nội dung
              </label>
              <div className="mt-1 p-4 bg-muted rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {modal.content}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày tạo
                </label>
                <div className="mt-1 text-sm">
                  {new Date(modal.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Cập nhật lần cuối
                </label>
                <div className="mt-1 text-sm">
                  {new Date(modal.updatedAt).toLocaleString("vi-VN")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
