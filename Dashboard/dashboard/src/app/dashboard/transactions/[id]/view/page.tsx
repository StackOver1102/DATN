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
  IconTrash,
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
  IconClock,
  IconCheck,
  IconX,
  IconUser,
  IconCalendar,
  IconHash,
  IconFileDescription,
  IconCreditCard,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/formatMoney";
import { User } from "../../../users/page";

interface Transaction {
  _id: string;
  userId: User;
  type: "deposit" | "payment" | "withdrawal" | "refund";
  method?: string;
  amount: number;
  status: "pending" | "success" | "failed";
  transactionCode: string;
  description?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionViewPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch transaction data
  const {
    data: transactionData,
    isLoading,
    error,
  } = useApiQuery<{ data: Transaction }>(
    ["transaction", id as string],
    `/transactions/${id}`
  );

  const transaction = transactionData?.data;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          Đang tải thông tin giao dịch...
        </div>
      </div>
    );
  }

  // Error state
  if (error || !transaction) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy giao dịch"}
        </div>
      </div>
    );
  }

  // Determine if the amount should be displayed as positive or negative
  const isPositive =
    transaction.type === "deposit" || transaction.type === "refund";
  const displayAmount = Math.abs(transaction.amount);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <IconClock className="h-3 w-3" /> Đang xử lý
          </Badge>
        );
      case "success":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <IconCheck className="h-3 w-3" /> Thành công
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <IconX className="h-3 w-3" /> Thất bại
          </Badge>
        );
      default:
        return status;
    }
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <IconArrowUpRight className="h-3 w-3" /> Nạp tiền
          </Badge>
        );
      case "payment":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <IconArrowDownRight className="h-3 w-3" /> Thanh toán
          </Badge>
        );
      case "withdrawal":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <IconArrowDownRight className="h-3 w-3" /> Rút tiền
          </Badge>
        );
      case "refund":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <IconArrowUpRight className="h-3 w-3" /> Hoàn tiền
          </Badge>
        );
      default:
        return type;
    }
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
          <BreadcrumbLink href="/dashboard/transactions">
            Giao dịch
          </BreadcrumbLink>
        </BreadcrumbItem>

        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Chi tiết giao dịch</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi tiết giao dịch</h1>
        <div className="flex gap-2">
          {transaction.status === "pending" && (
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push(`/dashboard/transactions/${id}`)}
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Phê duyệt
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
              <CardTitle className="text-lg">Thông tin giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <IconCoin className="h-6 w-6 text-yellow-500" />
                    <span
                      className={`text-2xl font-bold ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatNumber(displayAmount)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">coin</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Trạng thái:</span>
                    <div>{getStatusBadge(transaction.status)}</div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      Loại giao dịch:
                    </span>
                    <div>{getTypeBadge(transaction.type)}</div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Phương thức:</span>
                    <span className="font-medium capitalize">
                      {transaction.method || "Coin"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Thời gian:</span>
                    <span className="text-sm">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID giao dịch</p>
                  <p className="font-mono text-xs break-all">
                    {transaction._id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mã giao dịch</p>
                  <div className="flex items-center gap-2">
                    <IconHash className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{transaction.transactionCode}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người dùng</p>
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/dashboard/users/${transaction.userId._id}/view`}
                      className="font-medium text-blue-500 hover:underline"
                    >
                      {transaction.userId.fullName || transaction.userId.email}
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số tiền</p>
                  <div className="flex items-center gap-2">
                    <IconCoin className="h-4 w-4 text-muted-foreground" />
                    <p
                      className={`font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatNumber(displayAmount)} coin
                    </p>
                  </div>
                </div>
                {transaction.balanceBefore !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Số dư trước</p>
                    <p className="font-medium">
                      {formatNumber(transaction.balanceBefore)} coin
                    </p>
                  </div>
                )}
                {transaction.balanceAfter !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Số dư sau</p>
                    <p className="font-medium">
                      {formatNumber(transaction.balanceAfter)} coin
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {formatDate(transaction.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {transaction.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <IconFileDescription className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{transaction.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {transaction.type === "payment" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Thông tin thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <IconCreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Không có thông tin chi tiết về đơn hàng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
