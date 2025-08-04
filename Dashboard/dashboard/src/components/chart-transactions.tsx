"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useApiQuery } from "@/lib/hooks/useApi"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { formatNumber } from "@/lib/formatMoney"
import { PageLoading } from "@/components/ui/loading"

interface Transaction {
  _id: string;
  type: "deposit" | "payment" | "withdrawal" | "refund";
  amount: number;
  status: "pending" | "success" | "failed";
  createdAt: string;
}

interface TransactionStats {
  date: string;
  deposit: number;
  payment: number;
  withdrawal: number;
  refund: number;
  total: number;
}

interface ChartTransactionsProps {
  className?: string;
}

const chartConfig = {
  deposit: {
    label: "Nạp tiền",
    color: "var(--green-500)",
  },
  payment: {
    label: "Thanh toán",
    color: "var(--red-500)",
  },
  withdrawal: {
    label: "Rút tiền",
    color: "var(--yellow-500)",
  },
  refund: {
    label: "Hoàn tiền",
    color: "var(--blue-500)",
  },
  total: {
    label: "Tổng",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartTransactions({ className }: ChartTransactionsProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Fetch transaction data from API
  const { data: transactionsData, isLoading, error } = useApiQuery<{ data: Transaction[] }>(
    ["transactions-chart", timeRange],
    `/transactions/chart-stats?period=${timeRange}`
  )

  // Process data for chart
  const processTransactionData = (transactions: Transaction[] | undefined): TransactionStats[] => {
    if (!transactions || transactions.length === 0) return []

    // Create a map to group transactions by date
    const transactionsByDate = new Map<string, { 
      deposit: number, 
      payment: number,
      withdrawal: number,
      refund: number,
      total: number
    }>()

    // Calculate date range based on timeRange
    const endDate = new Date()
    const startDate = new Date()
    if (timeRange === "7d") {
      startDate.setDate(endDate.getDate() - 7)
    } else if (timeRange === "30d") {
      startDate.setDate(endDate.getDate() - 30)
    } else if (timeRange === "90d") {
      startDate.setDate(endDate.getDate() - 90)
    }

    // Initialize all dates in the range with zero values
    const dateRange: Date[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Initialize the map with all dates in range
    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      transactionsByDate.set(dateStr, {
        deposit: 0,
        payment: 0,
        withdrawal: 0,
        refund: 0,
        total: 0
      })
    })

    // Group transactions by date and type
    transactions.forEach(transaction => {
      try {
        // Kiểm tra ngày có hợp lệ không
        const dateObj = new Date(transaction.createdAt);
        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date:", transaction.createdAt);
          return; // Bỏ qua giao dịch có ngày không hợp lệ
        }
        
        const date = dateObj.toISOString().split('T')[0];
        const amount = Math.abs(transaction.amount);
        
        // Skip if outside our date range
        if (!transactionsByDate.has(date)) return;
        
        const stats = transactionsByDate.get(date)!;
        
        if (transaction.type === "deposit") {
          stats.deposit += amount;
          stats.total += amount;
        } else if (transaction.type === "payment") {
          stats.payment += amount;
          stats.total += amount;
        } else if (transaction.type === "withdrawal") {
          stats.withdrawal += amount;
          stats.total += amount;
        } else if (transaction.type === "refund") {
          stats.refund += amount;
          stats.total += amount;
        }
      } catch (error) {
        console.error("Error processing transaction:", error, transaction);
      }
    });

    // Convert map to array for chart
    const result = Array.from(transactionsByDate.entries())
      .map(([date, stats]) => ({
        date,
        deposit: stats.deposit,
        payment: stats.payment,
        withdrawal: stats.withdrawal,
        refund: stats.refund,
        total: stats.total
      }))
      .filter(item => {
        // Lọc các ngày không hợp lệ hoặc trong tương lai
        try {
          const itemDate = new Date(item.date);
          const now = new Date();
          return !isNaN(itemDate.getTime()) && itemDate <= now;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  const chartData = processTransactionData(transactionsData?.data)

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Biểu đồ giao dịch</CardTitle>
          <CardDescription>Đang tải dữ liệu...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <PageLoading text="Đang tải dữ liệu biểu đồ..." />
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error || !transactionsData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Biểu đồ giao dịch</CardTitle>
          <CardDescription>Lỗi khi tải dữ liệu</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-center text-red-500">
            {error?.message || "Không thể tải dữ liệu biểu đồ"}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`@container/card ${className}`}>
      <CardHeader>
        <CardTitle>Biểu đồ giao dịch</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {timeRange === "7d" ? "7 ngày gần đây" : 
             timeRange === "30d" ? "30 ngày gần đây" : 
             "90 ngày gần đây"}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === "7d" ? "7 ngày" : 
             timeRange === "30d" ? "30 ngày" : 
             "90 ngày"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 ngày</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ngày</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 ngày</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Chọn khoảng thời gian"
            >
              <SelectValue placeholder="30 ngày gần đây" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 ngày gần đây
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ngày gần đây
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 ngày gần đây
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillDeposit" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--green-500)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--green-500)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillPayment" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--red-500)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--red-500)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                      return ""; // Trả về chuỗi rỗng nếu ngày không hợp lệ
                    }
                    return date.toLocaleDateString("vi-VN", {
                      month: "numeric",
                      day: "numeric",
                    });
                  } catch (error) {
                    return ""; // Trả về chuỗi rỗng nếu có lỗi
                  }
                }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatNumber(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) {
                          return "Ngày không hợp lệ";
                        }
                        return date.toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        });
                      } catch (error) {
                        return "Ngày không hợp lệ";
                      }
                    }}
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return formatNumber(value) + " coin";
                      }
                      return String(value);
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="deposit"
                type="monotone"
                fill="url(#fillDeposit)"
                stroke="var(--green-500)"
                strokeWidth={2}
              />
              <Area
                dataKey="payment"
                type="monotone"
                fill="url(#fillPayment)"
                stroke="var(--red-500)"
                strokeWidth={2}
              />
              <Area
                dataKey="total"
                type="monotone"
                fill="url(#fillTotal)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}