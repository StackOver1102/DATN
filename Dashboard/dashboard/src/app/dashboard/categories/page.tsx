"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PageLoading, Loading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { ApiResponse } from "@/interface/pagination";

interface Category {
  _id: string;
  id?: string; // Keep for backward compatibility
  name: string;
  description?: string;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string | null;
  childCount?: number; // Số lượng danh mục con
  image?: string;
  icon?: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [categoriesWithChildCount, setCategoriesWithChildCount] = useState<Category[]>([]);

  // Query for fetching categories
  const { data, isLoading, error, refetch } = useApiQuery<ApiResponse<Category[]>>(
    "categories",
    "/categories/parent/get-all",
    {
      refetchOnMount: true,
      staleTime: 0, // Consider data always stale
    }
  );
  
  // Query for fetching all categories to calculate child counts
  const { data: allCategoriesData } = useApiQuery<ApiResponse<Category[]>>(
    "all-categories",
    "/categories",
    {
      refetchOnMount: true,
      staleTime: 0,
    }
  );
  
  // Create mutation
  const { mutate: createCategory, isPending: isCreating } = useApiMutation<
    Category, 
    typeof newCategory
  >("categories", "/categories", "post");
  
  // Delete mutation
  const { mutate: deleteCategory, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("categories", `/categories/${categoryToDelete?._id}`, "delete");

  // Handle delete click
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  // Handle create category
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    createCategory(
      newCategory,
      {
        onSuccess: () => {
          toast.success("Danh mục đã được tạo thành công");
          setNewCategory({ name: "", description: "" });
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!categoryToDelete) return;

    deleteCategory(
      { id: categoryToDelete._id },
      {
        onSuccess: () => {
          toast.success("Danh mục đã được xóa thành công");
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
          refetch();
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };
  
  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };
  
  // Calculate child counts for each parent category
  useEffect(() => {
    if (data?.data && allCategoriesData?.data) {
      const parentCategories = data.data;
      const allCategories = allCategoriesData.data;
      
      const categoriesWithCount = parentCategories.map(category => {
        // Count children for this category
        const childCount = allCategories.filter(
          cat => cat.parentId === category._id
        ).length;
        
        return {
          ...category,
          childCount
        };
      });
      
      setCategoriesWithChildCount(categoriesWithCount);
    }
  }, [data, allCategoriesData]);

  // Define columns for DataTable
  const columns: ColumnDef<Category>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "_id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên danh mục",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => <div>{row.getValue("description") || "-"}</div>,
    },
    {
      id: "childCount",
      header: "Danh mục con",
      cell: ({ row }) => {
        const category = row.original;
        const childCount = category.childCount || 0;
        return (
          <div className="font-medium">
            {childCount > 0 ? (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {childCount}
              </Badge>
            ) : (
              "0"
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant={status ? "default" : "secondary"}
            className={status ? "bg-green-500" : "bg-gray-400"}
          >
            {status ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original;
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
                onClick={() => router.push(`/dashboard/categories/${category._id}/view`)}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/categories/${category._id}`)}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteClick(category)}
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

  if (isLoading) {
    return <PageLoading text="Đang tải danh sách danh mục..." />;
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Lỗi khi tải dữ liệu
          </div>
          <div className="text-muted-foreground">{error?.message}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/categories/sub-categories")}
          >
            Quản lý danh mục con
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-1" />
                Thêm danh mục
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm danh mục mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tên danh mục</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Input
                      id="description"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Đang tạo..." : "Tạo danh mục"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={categoriesWithChildCount.length > 0 ? categoriesWithChildCount : (data?.data || [])}
              searchKey="name"
              searchPlaceholder="Tìm kiếm danh mục..."
              filters={[
                {
                  columnId: "isActive",
                  title: "Trạng thái",
                  options: [
                    { label: "Hoạt động", value: "true" },
                    { label: "Không hoạt động", value: "false" },
                  ],
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <span className="font-semibold text-red-600">
                &ldquo;{categoryToDelete?.name}&rdquo;
              </span>
              ? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2"
            >
              {isDeleting && <Loading size="sm" variant="spinner" />}
              {isDeleting ? "Đang xóa..." : "Xóa danh mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
