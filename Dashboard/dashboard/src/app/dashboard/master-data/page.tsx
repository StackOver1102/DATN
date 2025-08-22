"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/useApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface MasterData {
  _id: string;
  type: string;
  code: string;
  name: string;
  content?: string;
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

const contentTypes = [
  {
    value: "terms-of-use",
    label: "Terms of Use",
  },
  {
    value: "privacy-policy",
    label: "Privacy Policy",
  },
  {
    value: "contact-us",
    label: "Contact Us",
  },
  {
    value: "about-us",
    label: "About Us",
  },
  {
    value: "faq",
    label: "FAQ",
  },
];

export default function ContentManagementPage() {
  // Fetch all master data
  const { data, isLoading, refetch } = useApiQuery<{ data: MasterData[] }>(
    `masterdata-list-all`,
    `/master-data`,
    {
      onError: (error) => {
        toast.error(`Error loading data: ${error.message}`);
      },
    }
  );

  const handleEdit = (id: string, type: string) => {
    window.location.href = `/dashboard/master-data/edit?tab=${type}&id=${id}`;
  };

  const handleView = () => {
    // Open a modal or navigate to view the content
    toast.info("View functionality will be implemented soon");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <Button
          onClick={() => (window.location.href = "/dashboard/master-data/edit")}
        >
          Add New Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Content</CardTitle>
          <CardDescription>View and manage all website content</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {contentTypes.find((t) => t.value === item.type)
                          ?.label || item.type}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <Badge variant="success" className="bg-green-500">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleView()}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(item._id, item.type)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No content found. Click the &quot;Add New Content&quot;
                      button to create content.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
