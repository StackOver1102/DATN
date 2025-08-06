"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/useApi";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CountUp from "react-countup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTransactions } from "@/components/chart-transactions";
import { PageLoading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
  IconClock,
  IconCheck,
  IconX,
  IconHome,
  IconEye,
  IconTrash,
  IconDotsVertical,
  IconCheck as IconApprove,
  IconArrowsUpDown,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { formatNumber } from "@/lib/formatMoney";
import { DataTable } from "@/components/ui/data-table";
import { Column, ColumnDef } from "@tanstack/react-table";
import { User } from "../users/page";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Transaction {
  _id: string;
  userId: User;
  userName?: string;
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
  id: string; // Add id field for DataTable compatibility
}

export default function TransactionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery<{
    data: Transaction[];
  }>(
    ["transactions", activeTab],
    activeTab === "all" ? "/transactions" : `/transactions?type=${activeTab}`
  );

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      toast.success("Giao dịch đã được xóa thành công");
      refetch();
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(
        "Lỗi khi xóa giao dịch: " + (error.message || "Đã xảy ra lỗi")
      );
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/transactions/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Giao dịch đã được phê duyệt thành công");
      refetch();
      setIsApproveDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(
        "Lỗi khi phê duyệt giao dịch: " + (error.message || "Đã xảy ra lỗi")
      );
    },
  });

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleApproveClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsApproveDialogOpen(true);
  };

  // Map transactions to include id field for DataTable
  const transactions =
    data?.data?.map((transaction) => ({
      ...transaction,
      id: transaction._id, // Map _id to id for DataTable
    })) || [];

  // Define columns for the data table
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "transactionCode",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Mã giao dịch
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => (
        <div className="font-medium">{row.original.transactionCode}</div>
      ),
    },
    {
      accessorKey: "userName",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Người dùng
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => (
        <Link
          href={`/dashboard/users/${row.original.userId._id}`}
          className="text-blue-500 hover:underline"
        >
          {row.original.userId.fullName || row.original.userId.email}
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Loại
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => {
        const type = row.original.type;

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
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Số tiền
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => {
        const amount = row.original.amount;
        const type = row.original.type;

        // Determine if the amount should be displayed as positive or negative
        const isPositive = type === "deposit" || type === "refund";
        const displayAmount = Math.abs(amount);

        return (
          <div
            className={`font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : "-"}
            {formatNumber(displayAmount)} coin
          </div>
        );
      },
    },
    {
      accessorKey: "method",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Phương thức
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => (
        <div className="text-sm text-muted-foreground capitalize">
          {row.original.method || "Coin"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Trạng thái
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => {
        const status = row.original.status;

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
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }: { column: Column<Transaction, unknown> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Thời gian
            <IconArrowsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: { original: Transaction } }) => {
        return format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm:ss");
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }: { row: { original: Transaction } }) => {
        const transaction = row.original;
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
                  router.push(`/dashboard/transactions/${transaction._id}/view`)
                }
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>

              {transaction.status === "pending" && (
                <DropdownMenuItem
                  onClick={() => handleApproveClick(transaction)}
                  className="text-green-600"
                >
                  <IconApprove className="mr-2 h-4 w-4" />
                  Phê duyệt
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(transaction)}
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

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!data?.data)
      return {
        total: 0,
        deposit: 0,
        payment: 0,
        totalAmount: 0,
        depositAmount: 0,
        paymentAmount: 0,
      };

    const transactions = data.data;

    return {
      total: transactions.length,
      deposit: transactions.filter((t) => t.type === "deposit").length,
      payment: transactions.filter((t) => t.type === "payment").length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      depositAmount: transactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + t.amount, 0),
      paymentAmount: transactions
        .filter((t) => t.type === "payment")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    };
  };

  const summary = calculateSummary();

  return (
    <>
      <div className="px-4 lg:px-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <IconHome className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <span className="mx-2 text-gray-400">&gt;</span>
          <BreadcrumbItem>
            <BreadcrumbLink>Giao dịch</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <h1 className="text-2xl font-bold mb-6">Quản lý giao dịch</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng giao dịch
              </CardTitle>
              <IconCoin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={summary.total} duration={2} separator="," />
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền:{" "}
                <CountUp
                  end={summary.totalAmount}
                  duration={2}
                  separator=","
                  decimals={0}
                />{" "}
                coin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nạp tiền</CardTitle>
              <IconArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={summary.deposit} duration={2} separator="," />
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền:{" "}
                <CountUp
                  end={summary.depositAmount}
                  duration={2}
                  separator=","
                  decimals={0}
                  suffix=" đ"
                />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Thanh toán</CardTitle>
              <IconArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={summary.payment} duration={2} separator="," />
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền:{" "}
                <CountUp
                  end={summary.paymentAmount}
                  duration={2}
                  separator=","
                  decimals={0}
                />{" "}
                coin
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biểu đồ giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartTransactions />
          </CardContent>
        </Card>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4">
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="deposit">Nạp tiền</TabsTrigger>
              <TabsTrigger value="payment">Thanh toán</TabsTrigger>
              <TabsTrigger value="withdrawal">Rút tiền</TabsTrigger>
              <TabsTrigger value="refund">Hoàn tiền</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Danh sách giao dịch</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <PageLoading text="Đang tải dữ liệu giao dịch..." />
                ) : error ? (
                  <div className="text-red-500 p-4">
                    Lỗi khi tải dữ liệu giao dịch
                  </div>
                ) : (
                  <DataTable
                    data={transactions}
                    columns={columns}
                    searchKey="transactionCode"
                    searchPlaceholder="Tìm kiếm giao dịch..."
                    filters={[
                      {
                        columnId: "type",
                        title: "Loại giao dịch",
                        options: [
                          { label: "Nạp tiền", value: "deposit" },
                          { label: "Thanh toán", value: "payment" },
                          { label: "Rút tiền", value: "withdrawal" },
                          { label: "Hoàn tiền", value: "refund" },
                        ],
                      },
                      {
                        columnId: "status",
                        title: "Trạng thái",
                        options: [
                          { label: "Đang xử lý", value: "pending" },
                          { label: "Thành công", value: "success" },
                          { label: "Thất bại", value: "failed" },
                        ],
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giao dịch</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedTransaction) {
                  deleteTransactionMutation.mutate(selectedTransaction._id);
                }
              }}
              disabled={deleteTransactionMutation.isPending}
            >
              {deleteTransactionMutation.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Transaction Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phê duyệt giao dịch</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt giao dịch này không?
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Mã giao dịch:</span>
                <span className="text-sm">
                  {selectedTransaction.transactionCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Loại giao dịch:</span>
                <span className="text-sm capitalize">
                  {selectedTransaction.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Số tiền:</span>
                <span className="text-sm">
                  {formatNumber(selectedTransaction.amount)} coin
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Người dùng:</span>
                <span className="text-sm">
                  {selectedTransaction.userId.fullName ||
                    selectedTransaction.userId.email}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedTransaction) {
                  approveTransactionMutation.mutate(selectedTransaction._id);
                }
              }}
              disabled={approveTransactionMutation.isPending}
            >
              {approveTransactionMutation.isPending
                ? "Đang xử lý..."
                : "Phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
