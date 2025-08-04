"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useApiQuery } from "@/lib/hooks/useApi";
import { api } from "@/lib/api";
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
  IconCheck,
  IconX,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User } from "../../users/page";

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

export default function TransactionEditPage() {
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
    refetch,
  } = useApiQuery<{ data: Transaction }>(
    ["transaction", id as string],
    `/transactions/${id}`
  );

  const transaction = transactionData?.data;

  // Approve transaction mutation
  const approveTransactionMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/transactions/${id}/approve`, {}),
    onSuccess: () => {
      toast.success('Giao dịch đã được phê duyệt thành công');
      refetch();
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 1500);
    },
    onError: (error: any) => {
      toast.error('Lỗi khi phê duyệt giao dịch: ' + (error.message || 'Đã xảy ra lỗi'));
    }
  });

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

  // Handle approve transaction
  const handleApproveTransaction = () => {
    approveTransactionMutation.mutate(transaction._id);
  };

  return (
    <div className="px-4 lg:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <IconHome className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/transactions">Giao dịch</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Phê duyệt giao dịch</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Phê duyệt giao dịch</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/transactions')}
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin giao dịch #{transaction.transactionCode}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Mã giao dịch</p>
              <p className="font-medium">{transaction.transactionCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Người dùng</p>
              <p className="font-medium">{transaction.userId.fullName || transaction.userId.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Loại giao dịch</p>
              <p className="font-medium capitalize">{transaction.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số tiền</p>
              <p className="font-medium">{Math.abs(transaction.amount)} coin</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phương thức</p>
              <p className="font-medium capitalize">{transaction.method || "Coin"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <Badge variant={transaction.status === "pending" ? "outline" : transaction.status === "success" ? "success" : "destructive"}>
                {transaction.status === "pending" ? "Đang xử lý" : transaction.status === "success" ? "Thành công" : "Thất bại"}
              </Badge>
            </div>
          </div>

          {transaction.status === "pending" && (
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/transactions')}
              >
                Hủy
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApproveTransaction}
                disabled={approveTransactionMutation.isPending}
              >
                {approveTransactionMutation.isPending ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Phê duyệt giao dịch
                  </>
                )}
              </Button>
            </div>
          )}

          {transaction.status !== "pending" && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-md">
              <p className="text-yellow-700 text-sm">
                Giao dịch này đã được xử lý và không thể thay đổi trạng thái.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}