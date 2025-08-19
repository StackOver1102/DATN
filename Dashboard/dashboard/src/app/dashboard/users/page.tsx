"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ApiResponse } from "@/interface/pagination";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
  IconUser,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
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
import { userToasts } from "@/lib/toast";
import { PageLoading, Loading } from "@/components/ui/loading";
import { CircleDollarSign } from "lucide-react";

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  balance: number;
  isActive: boolean;
  isDeleted?: boolean;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery<ApiResponse<User[]>>(
    "users",
    "/users/with-spent"
  );

  // Delete mutation
  const { mutate: deleteUser, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("users", `/users/${userToDelete?._id}`, "delete");

  // Handle delete confirmation
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!userToDelete) return;

    deleteUser(
      { id: userToDelete._id },
      {
        onSuccess: () => {
          userToasts.deleted();
          setDeleteModalOpen(false);
          setUserToDelete(null);
          refetch(); // Refresh the data
        },
        onError: (error) => {
          userToasts.error(error.message);
        },
      }
    );
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Hàm xuất danh sách email người dùng ra file Excel
  const exportEmailsToExcel = () => {
    if (!data?.data?.length) return;

    setIsExporting(true);

    try {
      // Tạo mảng dữ liệu cho file Excel
      const emailList = data.data.map((user, index) => ({
        STT: index + 1,
        "Họ và tên": user.fullName,
        Email: user.email,
        "Vai trò": user.role === "admin" ? "Quản trị viên" : "Người dùng",
        "Số dư": user.balance,
        "Số tiền đã tiêu": user.totalSpent || 0,
        "Trạng thái": user.isDeleted ? "Đã xóa" : "Hoạt động",
      }));

      // Tạo workbook và worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(emailList);

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách email");

      // Tạo tên file với timestamp để tránh trùng lặp
      const fileName = `danh_sach_email_nguoi_dung_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Xuất file Excel
      XLSX.writeFile(workbook, fileName);

      // Hiển thị thông báo thành công
      userToasts.success("Xuất danh sách email thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error);
      userToasts.error("Có lỗi xảy ra khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Custom filter function to handle boolean values
  const booleanFilterFn: FilterFn<User> = (row, columnId, filterValue) => {
    const value = row.getValue(columnId) as boolean;
    return filterValue.includes(String(value));
  };

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "fullName",
      header: "Họ và tên",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconUser className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("fullName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge
            variant={role === "admin" ? "default" : "secondary"}
            className={role === "admin" ? "bg-blue-500" : "bg-gray-400"}
          >
            {role === "admin" ? "Quản trị viên" : "Người dùng"}
          </Badge>
        );
      },
      filterFn: booleanFilterFn,
    },
    {
      accessorKey: "balance",
      header: "Số dư",
      cell: ({ row }) => {
        const balance = parseFloat(row.getValue("balance"));
        return (
          <div className="font-mono flex items-center gap-1">
            {balance.toLocaleString("vi-VN")}
            <CircleDollarSign className="w-5 h-5 text-yellow-500" />
          </div>
        );
      },
    },
    {
      accessorKey: "totalSpent",
      header: "Số tiền đã tiêu",
      cell: ({ row }) => {
        const totalSpent = parseFloat(row.getValue("totalSpent"));
        return (
          <div className="font-mono">
            {totalSpent.toLocaleString("vi-VN")} coin
          </div>
        );
      },
    },
    {
      accessorKey: "isDeleted",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("isDeleted") as boolean;
        return (
          <Badge
            variant={status ? "destructive" : "secondary"}
            className={status ? "bg-red-500" : "bg-green-500"}
          >
            {status ? "Đã xóa" : "Hoạt động"}
          </Badge>
        );
      },
      filterFn: booleanFilterFn,
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
        const user = row.original;
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
                onClick={() => router.push(`/dashboard/users/${user._id}/view`)}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/users/${user._id}`)}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(user)}
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
    return <PageLoading text="Đang tải danh sách người dùng..." />;
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
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportEmailsToExcel}
            disabled={isExporting || isLoading || !data?.data?.length}
          >
            {isExporting ? (
              <Loading size="sm" variant="spinner" className="mr-1" />
            ) : (
              <IconFileSpreadsheet className="h-4 w-4 mr-1" />
            )}
            {isExporting ? "Đang xuất..." : "Xuất email"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/users/create")}
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data?.data || []}
              searchKey="fullName"
              searchPlaceholder="Tìm kiếm người dùng..."
              filters={[
                {
                  columnId: "role",
                  title: "Vai trò",
                  options: [
                    { label: "Quản trị viên", value: "admin" },
                    { label: "Người dùng", value: "user" },
                  ],
                },
                {
                  columnId: "isDeleted",
                  title: "Trạng thái",
                  options: [
                    { label: "Đã xóa", value: "true" },
                    { label: "Hoạt động", value: "false" },
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
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa người dùng{" "}
              <span className="font-semibold text-red-600">
                &ldquo;{userToDelete?.fullName}&rdquo;
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
              {isDeleting ? "Đang xóa..." : "Xóa người dùng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
