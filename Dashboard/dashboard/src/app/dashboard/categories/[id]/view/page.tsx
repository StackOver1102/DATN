"use client";

import { useApiQuery } from "@/lib/hooks/useApi";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { format } from "date-fns";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { ApiResponse } from "@/interface/pagination";

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
}

export default function CategoryViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Fetch category details
  const { data, isLoading, error } = useApiQuery<ApiResponse<Category>>(
    `category-${id}`,
    `/categories/${id}`,
    {
      refetchOnMount: true,
    }
  );

  // Fetch subcategories
  const { data: subCategoriesData, isLoading: isLoadingSubCategories } = useApiQuery<ApiResponse<Category[]>>(
    `subcategories-${id}`,
    `/categories?parent=${id}`,
    {
      refetchOnMount: true,
    }
  );

  if (isLoading || isLoadingSubCategories) {
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
  const subcategories = subCategoriesData?.data || [];

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
          <h1 className="text-2xl font-bold">Chi tiết danh mục</h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/categories/${id}`)}
        >
          <IconEdit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="px-4 lg:px-6 py-4 grid gap-4">
        {/* Category Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-medium">{category._id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tên danh mục</div>
                  <div className="font-medium">{category.name}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Mô tả</div>
                <div className="font-medium">{category.description || "Không có mô tả"}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <Badge
                    variant={category.isActive ? "default" : "secondary"}
                    className={category.isActive ? "bg-green-500" : "bg-gray-400"}
                  >
                    {category.isActive ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Ngày tạo</div>
                  <div className="font-medium">
                    {category.createdAt ? format(new Date(category.createdAt), "dd/MM/yyyy HH:mm") : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cập nhật lần cuối</div>
                  <div className="font-medium">
                    {category.updatedAt ? format(new Date(category.updatedAt), "dd/MM/yyyy HH:mm") : "N/A"}
                  </div>
                </div>
              </div>

              {category.parentId && (
                <div>
                  <div className="text-sm text-muted-foreground">Danh mục cha</div>
                  <div className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => router.push(`/dashboard/categories/${category.parentId}/view`)}
                    >
                      {category.parentId}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subcategories Card */}
        <Card>
          <CardHeader>
            <CardTitle>Danh mục con</CardTitle>
          </CardHeader>
          <CardContent>
            {subcategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcategories.map((subcategory) => (
                  <Card key={subcategory._id} className="cursor-pointer hover:bg-accent/50"
                    onClick={() => router.push(`/dashboard/categories/${subcategory._id}/view`)}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{subcategory.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {subcategory.description || "Không có mô tả"}
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant={subcategory.isActive ? "default" : "secondary"}
                          className={subcategory.isActive ? "bg-green-500" : "bg-gray-400"}
                        >
                          {subcategory.isActive ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Không có danh mục con nào.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
