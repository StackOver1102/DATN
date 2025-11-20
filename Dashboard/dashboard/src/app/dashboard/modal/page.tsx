"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ApiResponse } from "@/interface/pagination";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconTrash,
  IconPlus,
  IconWindow,
} from "@tabler/icons-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useState, Suspense } from "react";
import { PageLoading, Loading } from "@/components/ui/loading";
import Link from "next/link";

interface Modal {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ModalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modalToDelete, setModalToDelete] = useState<Modal | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery<ApiResponse<Modal[]>>(
    ["initmodal"],
    "/initmodal"
  );

  // Delete mutation
  const { mutate: deleteModal, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("initmodal", `/initmodal/${modalToDelete?._id}`, "delete");

  // Handle delete confirmation
  const handleDeleteClick = (modal: Modal) => {
    setModalToDelete(modal);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!modalToDelete) return;

    deleteModal(
      { id: modalToDelete._id },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setModalToDelete(null);
          refetch(); // Refresh the data
        },
        onError: (error) => {
          console.error("Error deleting modal:", error.message);
        },
      }
    );
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setModalToDelete(null);
  };

  // Custom filter function to handle status values
  const statusFilterFn: FilterFn<Modal> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as boolean;
    return filterValue.includes(value.toString());
  };

  const columns: ColumnDef<Modal>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "_id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Nội dung",
      cell: ({ row }) => {
        const content = row.getValue("content") as string;
        const truncatedContent = content.length > 50 
          ? content.substring(0, 50) + "..." 
          : content;
        return (
          <div className="text-sm text-muted-foreground max-w-xs">
            {truncatedContent}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-500" : "bg-gray-500"}
          >
            {isActive ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        );
      },
      filterFn: statusFilterFn,
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("vi-VN")}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const modal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/modal/${modal._id}/view`)
                }
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/modal/${modal._id}`)}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(modal)}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoading text="Đang tải danh sách modal..." />;
  }

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

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Quản lý Modal</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/modal/create")}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Tạo Modal
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWindow className="h-5 w-5" />
              Tất cả Modal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data?.data || []}
              searchKey="title"
              searchPlaceholder="Tìm kiếm modal..."
              filters={[
                {
                  columnId: "isActive",
                  title: "Trạng thái",
                  options: [
                    { label: "Hoạt động", value: "true" },
                    { label: "Không hoạt động", value: "false" },
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
            <DialogTitle>Xác nhận xóa modal</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa modal{" "}
              <span className="font-semibold text-red-600">
                &ldquo;{modalToDelete?.title}&rdquo;
              </span>
              ? Hành động này không thể hoàn tác.
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
              className="inline-flex items-center justify-center gap-2"
            >
              {isDeleting && <Loading size="sm" variant="spinner" />}
              {isDeleting ? "Đang xóa..." : "Xóa modal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ModalPage() {
  return (
    <Suspense fallback={<PageLoading text="Đang tải danh sách modal..." />}>
      <ModalPageContent />
    </Suspense>
  );
}