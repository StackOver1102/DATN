"use client";

import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const { data, isLoading, error } = useApiQuery<Transaction[]>(
    "transactions",
    "/transactions"
  );

  const mockData = [
    {
      id: "1",
      userId: "user1",
      userName: "John Doe",
      type: "deposit",
      amount: 100,
      status: "completed",
      createdAt: "2023-06-15T10:30:00Z",
    },
    {
      id: "2",
      userId: "user2",
      userName: "Jane Smith",
      type: "purchase",
      amount: -49.99,
      status: "completed",
      createdAt: "2023-06-16T14:20:00Z",
    },
    {
      id: "3",
      userId: "user3",
      userName: "Robert Johnson",
      type: "deposit",
      amount: 200,
      status: "completed",
      createdAt: "2023-06-17T09:15:00Z",
    },
    {
      id: "4",
      userId: "user1",
      userName: "John Doe",
      type: "purchase",
      amount: -29.99,
      status: "completed",
      createdAt: "2023-06-18T16:45:00Z",
    },
    {
      id: "5",
      userId: "user4",
      userName: "Emily Davis",
      type: "deposit",
      amount: 50,
      status: "pending",
      createdAt: "2023-06-19T11:10:00Z",
    },
  ];

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                Loading transactions...
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading transactions</div>
            ) : (
              <DataTable data={data || mockData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
