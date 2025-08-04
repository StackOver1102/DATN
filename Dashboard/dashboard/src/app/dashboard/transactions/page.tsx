"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
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
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

interface Transaction {
  _id: string;
  userId: string;
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
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data, isLoading, error } = useApiQuery<{ data: Transaction[] }>(
    ["transactions", activeTab],
    activeTab === "all" ? "/transactions" : `/transactions?type=${activeTab}`
  );

  // Map transactions to include id field for DataTable
  const transactions =
    data?.data?.map((transaction) => ({
      ...transaction,
      id: transaction._id, // Map _id to id for DataTable
    })) || [];

  // Define columns for the data table
  const columns: any[] = [
    {
      accessorKey: "transactionCode",
      header: "Mã giao dịch",
      cell: ({ row }: { row: { original: Transaction } }) => (
        <div className="font-medium">{row.original.transactionCode}</div>
      ),
    },
    {
      accessorKey: "userName",
      header: "Người dùng",
      cell: ({ row }: { row: { original: Transaction } }) =>
        row.original.userName || "N/A",
    },
    {
      accessorKey: "type",
      header: "Loại",
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
      header: "Số tiền",
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
            {displayAmount} coin
          </div>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Phương thức",
      cell: ({ row }: { row: { original: Transaction } }) =>
        row.original.method || "N/A",
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
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
      header: "Thời gian",
      cell: ({ row }: { row: { original: Transaction } }) => {
        return format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm:ss");
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
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền: {summary.totalAmount} coin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nạp tiền</CardTitle>
              <IconArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.deposit}</div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền: {summary.depositAmount} coin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Thanh toán</CardTitle>
              <IconArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.payment}</div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiền: {summary.paymentAmount} coin
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biểu đồ giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive />
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
                  <DataTable data={transactions} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
