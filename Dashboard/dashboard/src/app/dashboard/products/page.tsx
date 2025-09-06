"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ApiResponse, PaginatedResult } from "@/interface/pagination";
import { ColumnDef, FilterFn, VisibilityState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconSelector,
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
import { toast } from "sonner";

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
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Set staleTime to 0 to always refetch when component mounts
  const { data, isLoading, error, refetch } = useApiQuery<
    ApiResponse<Product[]>
  >(["products", String(pagination.pageIndex), String(pagination.pageSize)], 
    `/products/getAll/admin`, {
    refetchOnMount: true,
    staleTime: 0, // Consider data always stale
  });


  // Delete mutation - will be called with proper endpoint
  const { mutate: deleteProduct, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("products", `/products/${productToDelete?._id}`, "delete");
  
  // Bulk delete mutation
  const { mutate: bulkDeleteProducts, isPending: isBulkDeleting } = useApiMutation<
    { success: boolean; message: string },
    { ids: string[] }
  >("products", "/products/delete/batch", "post");

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (isBulkDelete) {
      // Handle bulk delete
      const ids = selectedProducts.map(product => product._id);
      
      bulkDeleteProducts(
        { ids },
        {
          onSuccess: () => {
            toast.success(`Đã xóa ${ids.length} sản phẩm thành công`);
            setDeleteModalOpen(false);
            setSelectedProducts([]);
            setIsBulkDelete(false);
            refetch(); // Refresh the data
          },
          onError: (error) => {
            productToasts.error(error.message);
          },
        }
      );
    } else {
      // Handle single delete
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
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
    if (isBulkDelete) {
      setIsBulkDelete(false);
    }
  };
  
  // Handle bulk delete click
  const handleBulkDeleteClick = (selectedRows: Product[]) => {
    if (selectedRows.length === 0) {
      productToasts.error("Vui lòng chọn ít nhất một sản phẩm để xóa");
      return;
    }
    
    setSelectedProducts(selectedRows);
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  // Custom filter function to handle boolean values
  const booleanFilterFn: FilterFn<Product> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as boolean;
    // Convert boolean to string for comparison with filter value
    return filterValue.includes(String(value));
  };
  
  // Custom filter function to handle string values (for categories)
  const stringFilterFn: FilterFn<Product> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as string;
    if (!value) return false;
    return filterValue.includes(value);
  };
  
  // Custom global filter function to search across multiple fields
  const multiFieldFilterFn: FilterFn<Product> = (row, columnId, filterValue) => {
    const searchTerm = filterValue.toLowerCase();
    
    // Search in name field
    const name = row.getValue("name") as string;
    if (name && name.toLowerCase().includes(searchTerm)) return true;
    
    // Search in categoryPath field
    const categoryPath = row.getValue("categoryPath") as string;
    if (categoryPath && categoryPath.toLowerCase().includes(searchTerm)) return true;
    
    // Search in categoryName field
    const categoryName = row.getValue("categoryName") as string;
    if (categoryName && categoryName.toLowerCase().includes(searchTerm)) return true;
    
    return false;
  };
  
  // Thiết lập ban đầu để ẩn cột global
  const [initialColumnVisibility] = useState<VisibilityState>({
    global: false,
  });
  
  // Hàm hiển thị biểu tượng sắp xếp
  const getSortIcon = (isSorted: false | "asc" | "desc") => {
    if (isSorted === false) {
      return <IconSelector className="ml-2 h-4 w-4" />;
    } else if (isSorted === "asc") {
      return <IconArrowUp className="ml-2 h-4 w-4" />;
    } else {
      return <IconArrowDown className="ml-2 h-4 w-4" />;
    }
  };

  // Add a virtual column for global search
  const columns: ColumnDef<Product>[] = [
    {
      id: "global",
      accessorFn: (row) => row.name, // Không quan trọng, vì chúng ta sẽ sử dụng multiFieldFilterFn
      filterFn: multiFieldFilterFn,
      enableHiding: false,
      enableSorting: false,
      enableColumnFilter: false,
      size: 0, // Đặt kích thước bằng 0
      minSize: 0,
      maxSize: 0,
      meta: {
        hidden: true, // Đánh dấu cột này là ẩn
      },
    },
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
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("_id")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên sản phẩm
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Giá
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        return <div>{price} coin</div>;
      },
      enableSorting: true,
    },
    {
      accessorKey: "categoryPath",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Danh mục cha
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("categoryPath")}</div>,
      filterFn: stringFilterFn,
      enableSorting: true,
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Danh mục con
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("categoryName")}</div>,
      filterFn: stringFilterFn,
      enableSorting: true,
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Trạng thái
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
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
      enableSorting: true,
    },
    {
      accessorKey: "isPro",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Là sản phẩm PRO
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => {
        const isPro = row.getValue("isPro") as boolean;
        return <div>{isPro ? "Có" : "Không"}</div>;
      },
      enableSorting: true,
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Ngày tạo
            {getSortIcon(column.getIsSorted())}
          </button>
        )
      },
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt") as string;
        const date = new Date(updatedAt);
        return <div>{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}/{date.getFullYear()} {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}</div>;
      },
      enableSorting: true,
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
              data={data?.data || []}
              searchKey="global"
              searchPlaceholder="Tìm kiếm theo tên, danh mục cha, danh mục con..."
              initialColumnVisibility={initialColumnVisibility}
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
                  columnId: "categoryPath",
                  title: "Danh mục cha",
                  options: Array.from(
                    new Set(data?.data.map(item => item.categoryPath).filter(Boolean))
                  ).map(value => ({ label: value as string, value: value as string })),
                },
                {
                  columnId: "categoryName",
                  title: "Danh mục con",
                  options: Array.from(
                    new Set(data?.data.map(item => item.categoryName).filter(Boolean))
                  ).map(value => ({ label: value as string, value: value as string })),
                },
              ]}
              pagination={{
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
                pageCount: Math.ceil((data?.data.length || 0) / pagination.pageSize),
                onPageChange: (pageIndex: number) => setPagination(prev => ({ ...prev, pageIndex })),
                onPageSizeChange: (pageSize: number) => setPagination({ pageIndex: 0, pageSize }),
              }}
              enableRowSelection
              onRowSelectionChange={(selectedRows) => {
                // Chỉ cập nhật selectedProducts khi thực sự cần thiết để tránh vòng lặp vô hạn
                const products = selectedRows.map(index => data?.data[index] as Product);
                // Sử dụng hàm callback để đảm bảo chúng ta không tạo vòng lặp cập nhật
                setSelectedProducts(prevSelected => {
                  // Chỉ cập nhật nếu có sự thay đổi thực sự
                  if (prevSelected.length !== products.length || 
                      JSON.stringify(prevSelected.map(p => p._id).sort()) !== 
                      JSON.stringify(products.map(p => p._id).sort())) {
                    return products;
                  }
                  return prevSelected;
                });
              }}
              bulkActions={[
                {
                  label: "Xóa đã chọn",
                  icon: <IconTrash className="h-4 w-4" />,
                  variant: "destructive",
                  onClick: () => handleBulkDeleteClick(selectedProducts),
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
            <DialogTitle>
              {isBulkDelete 
                ? `Xác nhận xóa ${selectedProducts.length} sản phẩm` 
                : "Xác nhận xóa sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              {isBulkDelete ? (
                <>
                  Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">{selectedProducts.length} sản phẩm</span> đã chọn? Hành động này không thể hoàn tác.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa sản phẩm{" "}
                  <span className="font-semibold text-red-600">
                    &ldquo;{productToDelete?.name}&rdquo;
                  </span>
                  ? Hành động này không thể hoàn tác.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting || isBulkDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || isBulkDeleting}
              className="inline-flex items-center justify-center gap-2"
            >
              {(isDeleting || isBulkDeleting) && <Loading size="sm" variant="spinner" />}
              {isDeleting || isBulkDeleting 
                ? "Đang xóa..." 
                : isBulkDelete 
                  ? `Xóa ${selectedProducts.length} sản phẩm` 
                  : "Xóa sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
