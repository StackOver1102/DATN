"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

interface Banner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  isActive: boolean;
  position: "home" | "product_detail" | "about";
  createdAt: string;
  updatedAt: string;
  id: string; // For DataTable compatibility
}

interface BannerResponse {
  data: Banner[];
}

// Toast functions for banner operations
const bannerToasts = {
  deleted: () => showSuccessToast("Banner đã được xóa thành công"),
  statusToggled: () => showSuccessToast("Trạng thái banner đã được cập nhật"),
  error: (message: string) => showErrorToast(`Lỗi: ${message}`),
};

export default function BannerPage() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

  // Fetch banners data
  const { data, isLoading, error, refetch } = useApiQuery<BannerResponse>(
    "banners",
    "/banners",
    {
      refetchOnMount: true,
      staleTime: 0,
    }
  );

  // Delete mutation
  const { mutate: deleteBanner, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("banners", `/banners/${bannerToDelete?._id}`, "delete");

  // Toggle status mutation
  // const { mutate: toggleStatus, isPending: isToggling } = useApiMutation<
  //   { success: boolean; message: string },
  //   { id: string }
  // >("banners", `/banners/${bannerToDelete?._id}/toggle-status`, "patch");

  // Handle delete confirmation
  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!bannerToDelete) return;

    deleteBanner(
      { id: bannerToDelete._id },
      {
        onSuccess: () => {
          bannerToasts.deleted();
          setDeleteModalOpen(false);
          setBannerToDelete(null);
          refetch();
        },
        onError: (error) => {
          bannerToasts.error(error.message);
        },
      }
    );
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBannerToDelete(null);
  };

  // Handle toggle status
  const handleToggleStatus = async (banner: Banner) => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/banners/${banner._id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        bannerToasts.statusToggled();
        refetch();
      } else {
        throw new Error("Failed to toggle status");
      }
    } catch (error) {
      bannerToasts.error(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  // Position labels
  const getPositionLabel = (position: string) => {
    switch (position) {
      case "home":
        return "Trang chủ";
      case "product_detail":
        return "Chi tiết sản phẩm";
      case "about":
        return "Giới thiệu";
      default:
        return position;
    }
  };

  // Position badge variant
  const getPositionVariant = (position: string) => {
    switch (position) {
      case "home":
        return "default";
      case "product_detail":
        return "secondary";
      case "about":
        return "outline";
      default:
        return "outline";
    }
  };

  // Table columns
  const columns: ColumnDef<Banner>[] = [
    {
      accessorKey: "imageUrl",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const imageUrl = row.getValue("imageUrl") as string;
        return (
          <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={row.original.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-image.png";
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return (
          <div className="font-medium max-w-[200px] truncate" title={title}>
            {title}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div
            className="max-w-[200px] truncate text-muted-foreground"
            title={description}
          >
            {description || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Vị trí",
      cell: ({ row }) => {
        const position = row.getValue("position") as string;
        return (
          <Badge variant={getPositionVariant(position)}>
            {getPositionLabel(position)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm">{date.toLocaleDateString("vi-VN")}</div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const banner = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/banner/${banner._id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleStatus(banner)}
                // disabled={isToggling}
              >
                {banner.isActive ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {banner.isActive ? "Tắt hiển thị" : "Bật hiển thị"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(banner)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải danh sách banner..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Lỗi khi tải dữ liệu
          </div>
          <div className="text-muted-foreground">{error?.message}</div>
        </div>
      </div>
    );
  }

  // Map data for table compatibility
  const bannersData = (data?.data || []).map((banner) => ({
    ...banner,
    id: banner._id,
  }));

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Quản lý Banner</h1>
        <Button onClick={() => router.push("/dashboard/banner/create")}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm banner
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả banner</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={bannersData}
              searchKey="title"
              searchPlaceholder="Tìm kiếm banner..."
              filters={[
                {
                  columnId: "isActive",
                  title: "Trạng thái",
                  options: [
                    { label: "Hoạt động", value: "true" },
                    { label: "Không hoạt động", value: "false" },
                  ],
                },
                {
                  columnId: "position",
                  title: "Vị trí",
                  options: [
                    { label: "Trang chủ", value: "home" },
                    { label: "Chi tiết sản phẩm", value: "product_detail" },
                    { label: "Giới thiệu", value: "about" },
                  ],
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa banner</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa banner &quot;{bannerToDelete?.title}
              &quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
