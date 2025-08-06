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
  IconShoppingCart,
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
import { orderToasts } from "@/lib/toast";
import { PageLoading, Loading } from "@/components/ui/loading";

interface Order {
  _id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  amount: number;
  status: "pending" | "completed" | "cancelled" | "processing";
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  transactionId?: string;
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "all";
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery<ApiResponse<Order[]>>(
    ["orders", status],
    status === "all" ? "/orders" : `/orders?status=${status}`
  );

  // Delete mutation
  const { mutate: deleteOrder, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("orders", `/orders/${orderToDelete?._id}`, "delete");

  // Handle delete confirmation
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!orderToDelete) return;

    deleteOrder(
      { id: orderToDelete._id },
      {
        onSuccess: () => {
          orderToasts.deleted();
          setDeleteModalOpen(false);
          setOrderToDelete(null);
          refetch(); // Refresh the data
        },
        onError: (error) => {
          orderToasts.error(error.message);
        },
      }
    );
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Custom filter function to handle status values
  const statusFilterFn: FilterFn<Order> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as string;
    return filterValue.includes(value);
  };

  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "userName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("userName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Sản phẩm",
      cell: ({ row }) => <div>{row.getValue("productName")}</div>,
    },
    {
      accessorKey: "amount",
      header: "Giá trị",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <div className="font-mono font-semibold">
            {amount.toLocaleString("vi-VN")} coin
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusConfig = {
          pending: {
            label: "Chờ xử lý",
            variant: "secondary",
            color: "bg-yellow-500",
          },
          processing: {
            label: "Đang xử lý",
            variant: "default",
            color: "bg-blue-500",
          },
          completed: {
            label: "Hoàn thành",
            variant: "default",
            color: "bg-green-500",
          },
          cancelled: {
            label: "Đã hủy",
            variant: "secondary",
            color: "bg-red-500",
          },
        };
        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.pending;

        return (
          <Badge
            variant={config.variant as "default" | "secondary"}
            className={config.color}
          >
            {config.label}
          </Badge>
        );
      },
      filterFn: statusFilterFn,
    },
    {
      accessorKey: "createdAt",
      header: "Ngày đặt",
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
        const order = row.original;
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
                  router.push(`/dashboard/orders/${order._id}/view`)
                }
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/orders/${order._id}`)}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(order)}
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
    return <PageLoading text="Đang tải danh sách đơn hàng..." />;
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
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders/create")}
          >
            <IconShoppingCart className="h-4 w-4 mr-1" />
            Tạo đơn hàng
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data?.data || []}
              searchKey="userName"
              searchPlaceholder="Tìm kiếm đơn hàng..."
              filters={[
                {
                  columnId: "status",
                  title: "Trạng thái",
                  options: [
                    { label: "Chờ xử lý", value: "pending" },
                    { label: "Đang xử lý", value: "processing" },
                    { label: "Hoàn thành", value: "completed" },
                    { label: "Đã hủy", value: "cancelled" },
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
            <DialogTitle>Xác nhận xóa đơn hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng{" "}
              <span className="font-semibold text-red-600">
                &ldquo;{orderToDelete?.productName}&rdquo;
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
              {isDeleting ? "Đang xóa..." : "Xóa đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageLoading text="Đang tải danh sách đơn hàng..." />}>
      <OrdersPageContent />
    </Suspense>
  );
}
