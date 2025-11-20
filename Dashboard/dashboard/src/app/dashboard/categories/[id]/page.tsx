"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageLoading, Loading } from "@/components/ui/loading";
import { useState, useEffect } from "react";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { ApiResponse } from "@/interface/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  parentId?: string | null;
  image?: string;
  icon?: string;
}

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    description: "",
    isActive: true,
    parentId: null,
  });

  // Fetch category details
  const { data, isLoading, error } = useApiQuery<ApiResponse<Category>>(
    `category-${id}`,
    `/categories/${id}`,
    {
      refetchOnMount: true,
    }
  );

  // Fetch parent categories for dropdown
  const { data: parentCategoriesData, isLoading: isLoadingParentCategories } = useApiQuery<ApiResponse<Category[]>>(
    "parent-categories",
    "/categories/parent/get-all",
    {
      refetchOnMount: true,
    }
  );

  // Update mutation
  const { mutate: updateCategory, isPending: isUpdating } = useApiMutation<
    Category,
    Partial<Category>
  >(`category-${id}`, `/categories/${id}`, "patch");

  // Set form data when category data is loaded
  useEffect(() => {
    if (data?.data) {
      setFormData({
        name: data.data.name,
        description: data.data.description || "",
        isActive: data.data.isActive !== false, // default to true if undefined
        parentId: data.data.parentId || null,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateCategory(
      formData,
      {
        onSuccess: () => {
          toast.success("Danh mục đã được cập nhật thành công");
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleParentChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      parentId: value === "null" ? null : value 
    }));
  };

  if (isLoading || isLoadingParentCategories) {
    return <PageLoading text="Đang tải thông tin danh mục..." />;
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

  const category = data?.data;
  const parentCategories = parentCategoriesData?.data || [];

  // Filter out the current category from parent options to prevent self-reference
  const filteredParentCategories = parentCategories.filter(
    (parent) => parent._id !== id
  );

  if (!category) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Không tìm thấy danh mục
          </div>
          <div className="text-muted-foreground">
            Danh mục với ID {id} không tồn tại hoặc đã bị xóa.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa danh mục</h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/categories/${id}/view`)}
          variant="outline"
        >
          Xem chi tiết
        </Button>
      </div>

      <div className="px-4 lg:px-6 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên danh mục</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentId">Danh mục cha</Label>
                  <Select
                    value={formData.parentId?.toString() || "null"}
                    onValueChange={handleParentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục cha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Không có (Danh mục gốc)</SelectItem>
                      {filteredParentCategories.map((parent) => (
                        <SelectItem key={parent._id} value={parent._id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isActive">Hoạt động</Label>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  {isUpdating && <Loading size="sm" variant="spinner" />}
                  <IconDeviceFloppy className="h-4 w-4" />
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
