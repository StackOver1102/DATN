"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ApiResponse, PaginatedResult } from "@/interface/pagination";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
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
import { useState } from "react";
import { productToasts } from "@/lib/toast";
import { PageLoading, Loading } from "@/components/ui/loading";
import { useCallback } from "react";

interface Product {
  _id: string;
  id?: string; // Keep for backward compatibility
  name: string;
  price: number;
  category?: string;
  categoryName?: string;
  categoryPath?: string;
  status?: string;
  isActive: boolean;
  isPro: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Set staleTime to 0 to always refetch when component mounts
  const { data, isLoading, error, refetch } = useApiQuery<
    ApiResponse<PaginatedResult<Product>>
  >(["products", String(pagination.pageIndex), String(pagination.pageSize)], 
    `/products?page=${String(pagination.pageIndex + 1)}&limit=${String(pagination.pageSize)}`, {
    refetchOnMount: true,
    staleTime: 0, // Consider data always stale
  });

  // Delete mutation - will be called with proper endpoint
  const { mutate: deleteProduct, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("products", `/products/${productToDelete?._id}`, "delete");

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!productToDelete) return;

    deleteProduct(
      { id: productToDelete._id },
      {
        onSuccess: () => {
          productToasts.deleted();
          setDeleteModalOpen(false);
          setProductToDelete(null);
          refetch(); // Refresh the data
        },
        onError: (error) => {
          productToasts.error(error.message);
        },
      }
    );
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // Custom filter function to handle boolean values
  const booleanFilterFn: FilterFn<Product> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as boolean;
    // Convert boolean to string for comparison with filter value
    return filterValue.includes(String(value));
  };

  const columns: ColumnDef<Product>[] = [
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
        <div className="font-medium">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        return <div>{price} coin</div>;
      },
    },
    {
      accessorKey: "categoryPath",
      header: "Danh mục cha",
      cell: ({ row }) => <div>{row.getValue("categoryPath")}</div>,
    },
    {
      accessorKey: "categoryName",
      header: "Danh mục con",
      cell: ({ row }) => <div>{row.getValue("categoryName")}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant={status ? "default" : "secondary"}
            className={status ? "bg-green-500" : "bg-gray-400"}
          >
            {status ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        );
      },
      filterFn: booleanFilterFn,
    },
    {
      accessorKey: "isPro",
      header: "Là sản phẩm PRO",
      cell: ({ row }) => {
        const isPro = row.getValue("isPro") as boolean;
        return <div>{isPro ? "Có" : "Không"}</div>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt") as string;
        const date = new Date(updatedAt);
        return <div>{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}/{date.getFullYear()} {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
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
                  router.push(`/dashboard/products/${product._id}/view`)
                }
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/products/${product._id}`)
                }
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(product)}
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
    return <PageLoading text="Đang tải danh sách sản phẩm..." />;
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
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/products/batch-create")}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data?.data.items || []}
              searchKey="name"
              searchPlaceholder="Tìm kiếm sản phẩm..."
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
              pagination={{
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
                pageCount: data?.data.meta.totalPages || 1,
                              onPageChange: (pageIndex: number) => setPagination(prev => ({ ...prev, pageIndex })),
              onPageSizeChange: (pageSize: number) => setPagination({ pageIndex: 0, pageSize }),
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <span className="font-semibold text-red-600">
                &ldquo;{productToDelete?.name}&rdquo;
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
              {isDeleting ? "Đang xóa..." : "Xóa sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
