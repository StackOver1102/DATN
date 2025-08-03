"use client";

import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Order {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "all";

  const { data, isLoading, error } = useApiQuery<Order[]>(
    ["orders", status],
    status === "all" ? "/orders" : `/orders?status=${status}`
  );

  const mockData = [
    {
      id: "1",
      userId: "user1",
      userName: "John Doe",
      productId: "prod1",
      productName: "3D Model Car",
      amount: 29.99,
      status: "completed",
      createdAt: "2023-06-15T10:30:00Z",
    },
    {
      id: "2",
      userId: "user2",
      userName: "Jane Smith",
      productId: "prod2",
      productName: "3D Model House",
      amount: 49.99,
      status: "pending",
      createdAt: "2023-06-16T14:20:00Z",
    },
    {
      id: "3",
      userId: "user3",
      userName: "Robert Johnson",
      productId: "prod3",
      productName: "3D Character Model",
      amount: 19.99,
      status: "completed",
      createdAt: "2023-06-17T09:15:00Z",
    },
    {
      id: "4",
      userId: "user4",
      userName: "Emily Davis",
      productId: "prod4",
      productName: "3D Furniture Set",
      amount: 39.99,
      status: "pending",
      createdAt: "2023-06-18T16:45:00Z",
    },
    {
      id: "5",
      userId: "user5",
      userName: "Michael Brown",
      productId: "prod5",
      productName: "3D Nature Pack",
      amount: 24.99,
      status: "completed",
      createdAt: "2023-06-19T11:10:00Z",
    },
  ];

  const filteredMockData =
    status === "all"
      ? mockData
      : mockData.filter((order) => order.status === status);

  const handleTabChange = (value: string) => {
    router.push(
      `/dashboard/orders${value !== "all" ? `?status=${value}` : ""}`
    );
  };

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <Tabs defaultValue={status} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {status === "all"
                    ? "All Orders"
                    : status === "pending"
                    ? "Pending Orders"
                    : "Completed Orders"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    Loading orders...
                  </div>
                ) : error ? (
                  <div className="text-red-500 p-4">Error loading orders</div>
                ) : (
                  <DataTable data={data || filteredMockData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
