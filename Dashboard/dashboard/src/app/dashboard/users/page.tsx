"use client";

import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  balance: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { data, isLoading, error } = useApiQuery<User[]>("users", "/users");

  const mockData = [
    {
      id: "1",
      email: "user1@example.com",
      fullName: "John Doe",
      role: "user",
      balance: 100,
    },
    {
      id: "2",
      email: "user2@example.com",
      fullName: "Jane Smith",
      role: "user",
      balance: 250,
    },
    {
      id: "3",
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin",
      balance: 0,
    },
    {
      id: "4",
      email: "user3@example.com",
      fullName: "Robert Johnson",
      role: "user",
      balance: 75,
    },
    {
      id: "5",
      email: "user4@example.com",
      fullName: "Emily Davis",
      role: "user",
      balance: 150,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => router.push("/dashboard/users/create")}>
          Add User
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading users...</div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading users</div>
            ) : (
              <DataTable data={data || mockData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
