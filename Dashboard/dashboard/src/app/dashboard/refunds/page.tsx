"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  IconHome,
  IconEye,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconArrowsUpDown,
  IconClock,
  IconCoin,
} from "@tabler/icons-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "../users/page";
import { formatNumber } from "@/lib/formatMoney";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { CircleDollarSign } from "lucide-react";

// Import RefundStatus enum from backend
enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

interface Refund {
  _id: string;
  userId: User;
  orderId: {
    _id: string;
    productId: {
      _id: string;
      name: string;
    };
  };
  transactionId?: string;
  amount: number;
  status: RefundStatus;
  description: string;
  images?: string[];
  adminNotes?: string;
  processedAt?: string;
  processedBy?: User;
  createdAt: string;
  updatedAt: string;
  isUnread?: boolean; // Added to track if the refund request has unread notifications
}

export default function RefundsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");

  const { refundNoti } = useNotifications();
  const { data, isLoading, error } = useApiQuery<{
    data: Refund[];
  }>(
    ["refunds", activeTab],
    activeTab === "all" ? "/refunds" : `/refunds?status=${activeTab}`
  );

  // Map refunds to include id field for DataTable
  // Map refunds to include id field for DataTable and check if it's unread
  const refunds =
    data?.data?.map((refund) => {
      // Check if this refund request has an unread notification
      const isUnread = refundNoti?.some(
        (noti) => noti.originalId === refund._id && !noti.isRead
      );

      return {
        ...refund,
        id: refund._id,
        isUnread: isUnread || false,
      };
    }) || [];

  // Define columns for the data table
  const columns: ColumnDef<Refund>[] = [
    {
      accessorKey: "_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          ID
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "userId",
      header: "Khách hàng",
      cell: ({ row }) => {
        const user = row.original.userId;
        return (
          <Link
            href={`/dashboard/users/${user?._id}`}
            className="text-blue-500 hover:underline"
          >
            {user?.fullName || user?.email}
          </Link>
        );
      },
    },
    {
      accessorKey: "orderId",
      header: "Đơn hàng",
      cell: ({ row }) => {
        const order = row.original.orderId;
        const isUnread = row.original.isUnread;
        return (
          <div className={`${isUnread ? "font-bold" : ""}`}>
            {isUnread && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            )}
            <Link
              href={`/dashboard/orders/${order?._id}/view`}
              className="text-blue-500 hover:underline"
            >
              {order.productId?.name || order._id}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Số tiền
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return (
          <div className="font-mono font-semibold flex items-center gap-1">
            {formatNumber(amount)}
            <CircleDollarSign className="w-5 h-5 text-yellow-500" />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Trạng thái
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as RefundStatus;

        switch (status) {
          case RefundStatus.PENDING:
            return (
              <Badge variant="outline" className="flex items-center gap-1">
                <IconClock className="h-3 w-3" /> Chờ xử lý
              </Badge>
            );
          case RefundStatus.APPROVED:
            return (
              <Badge
                variant="default"
                className="bg-blue-500 flex items-center gap-1"
              >
                <IconCheck className="h-3 w-3" /> Đã duyệt
              </Badge>
            );
          case RefundStatus.COMPLETED:
            return (
              <Badge variant="success" className="flex items-center gap-1">
                <IconCoin className="h-3 w-3" /> Đã hoàn tiền
              </Badge>
            );
          case RefundStatus.REJECTED:
            return (
              <Badge variant="destructive" className="flex items-center gap-1">
                <IconX className="h-3 w-3" /> Từ chối
              </Badge>
            );
          default:
            return status;
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Ngày yêu cầu
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const refund = row.original;
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
                onClick={() => {
                  // Navigate to detail page
                  router.push(`/dashboard/refunds/${refund._id}`);
                }}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
                {refund.isUnread && (
                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </DropdownMenuItem>
              {refund.status === RefundStatus.PENDING && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // Navigate to process page
                      router.push(`/dashboard/refunds/${refund._id}/process`);
                    }}
                    className="text-green-600"
                  >
                    <IconCheck className="mr-2 h-4 w-4" />
                    Xử lý yêu cầu
                    {refund.isUnread && (
                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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
          <BreadcrumbLink>Hoàn tiền</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Quản lý hoàn tiền</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu hoàn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading text="Đang tải dữ liệu hoàn tiền..." />
          ) : error ? (
            <div className="text-red-500 p-4">
              Lỗi khi tải dữ liệu hoàn tiền
            </div>
          ) : (
            <DataTable
              data={refunds}
              columns={columns}
              searchKey="userId"
              searchPlaceholder="Tìm kiếm theo khách hàng..."
              filters={[
                {
                  columnId: "status",
                  title: "Trạng thái",
                  options: [
                    { label: "Chờ xử lý", value: RefundStatus.PENDING },
                    { label: "Đã duyệt", value: RefundStatus.APPROVED },
                    { label: "Đã hoàn tiền", value: RefundStatus.COMPLETED },
                    { label: "Từ chối", value: RefundStatus.REJECTED },
                  ],
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}