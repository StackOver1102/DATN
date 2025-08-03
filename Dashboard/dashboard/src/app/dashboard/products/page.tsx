"use client";

import { useApiQuery } from "@/lib/hooks/useApi";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const { data, isLoading, error } = useApiQuery<
    ApiResponse<PaginatedResult<Product>>
  >("products", "/products");

  console.log(data);

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
              <DropdownMenuItem className="text-red-600">
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/dashboard/products/create")}>
            Thêm sản phẩm
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/products/batch-create")}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Tạo nhiều sản phẩm
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                Đang tải sản phẩm...
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">Lỗi khi tải dữ liệu</div>
            ) : (
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
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
