"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  IconHome,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
} from "@tabler/icons-react";
import { PageLoading } from "@/components/ui/loading";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discount: number;
  folderId?: string;
  images: string;
  sold: number;
  isActive: boolean;
  rating: number;
  views: number;
  likes: number;
  isPro: boolean;
  size: number;
  categoryId: string;
  categoryName: string;
  rootCategoryId?: string;
  categoryPath: string;
  materials?: string;
  style?: string;
  render?: string;
  form?: string;
  color?: string;
  urlDownload?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductViewPage() {
  const router = useRouter();
  const { id } = useParams();

  // Fetch product data
  const {
    data: productData,
    isLoading,
    error,
  } = useApiQuery<{ data: Product }>(
    ["product", id as string],
    `/products/${id}`
  );

  const product = productData?.data;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải thông tin sản phẩm..." />;
  }

  // Error state
  if (error || !product) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy sản phẩm"}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <IconHome className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/products">Sản phẩm</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Chi tiết sản phẩm</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/products/${id}`)}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm">
            <IconTrash className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images ? (
                <div className="relative w-full h-64">
                  <Image
                    src={product.images}
                    alt={product.name}
                    className="rounded-md object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    onError={() => {
                      // Fallback handled via next.config.js unoptimized images
                      console.log("Image failed to load");
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 h-64 flex items-center justify-center rounded-md">
                  <p className="text-gray-500">Không có hình ảnh</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Đã bán</p>
                  <p className="font-semibold">{product.sold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lượt xem</p>
                  <p className="font-semibold">{product.views}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lượt thích</p>
                  <p className="font-semibold">{product.likes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đánh giá</p>
                  <p className="font-semibold">{product.rating}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-mono text-xs break-all">{product._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <Badge
                    variant={product.isActive ? "default" : "secondary"}
                    className={
                      product.isActive ? "bg-green-500" : "bg-gray-400"
                    }
                  >
                    {product.isActive ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giá</p>
                  <p className="font-semibold">{product.price} coin</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giảm giá</p>
                  <p className="font-semibold">{product.discount}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Danh mục</p>
                  <p className="font-semibold">
                    {product.categoryPath || product.categoryName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kích thước</p>
                  <p className="font-semibold">{product.size} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loại sản phẩm</p>
                  <Badge variant={product.isPro ? "default" : "outline"}>
                    {product.isPro ? "PRO" : "Thường"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-semibold">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Mô tả</p>
                  <p className="whitespace-pre-line">
                    {product.description || "Không có mô tả"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thông số kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Chất liệu</p>
                  <p className="font-semibold capitalize">
                    {product.materials || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phong cách</p>
                  <p className="font-semibold capitalize">
                    {product.style || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Render</p>
                  <p className="font-semibold">{product.render || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hình dạng</p>
                  <p className="font-semibold capitalize">
                    {product.form || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Màu sắc</p>
                  <p className="font-semibold">{product.color || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tải xuống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.folderId && (
                  <div>
                    <p className="text-sm text-gray-500">ID Thư mục</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">
                        {product.folderId}
                      </p>
                      <Button size="sm" variant="outline">
                        <IconEye className="h-4 w-4 mr-1" />
                        Xem thư mục
                      </Button>
                    </div>
                  </div>
                )}

                {product.urlDownload && (
                  <div>
                    <p className="text-sm text-gray-500">URL Tải xuống</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">
                        {product.urlDownload}
                      </p>
                      <Button size="sm" variant="outline">
                        <IconDownload className="h-4 w-4 mr-1" />
                        Tải xuống
                      </Button>
                    </div>
                  </div>
                )}

                {!product.folderId && !product.urlDownload && (
                  <p className="text-gray-500">Không có thông tin tải xuống</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
