"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome } from "@tabler/icons-react";

// Enums from the backend
enum Material {
  BRICK = "brick",
  CERAMICS = "ceramics",
  CONCRETE = "concrete",
  FABRIC = "fabric",
  FUR = "fur",
  GLASS = "glass",
  GYPSUM = "gypsum",
  LEATHER = "leather",
  LIQUID = "liquid",
  METAL = "metal",
  ORGANICS = "organics",
  PAPER = "paper",
  PLASTIC = "plastic",
  RATTAN = "rattan",
  STONE = "stone",
  WOOD = "wood",
}

enum Style {
  LUXURY = "luxury",
  INDOCHINE = "indochine",
  ETHNIC = "ethnic",
  MODERN = "modern",
  CLASSIC = "classic",
}

enum Render {
  VRAY_CORONA = "vray+corona",
  CORONA = "corona",
  VRAY = "vray",
  MENTAL_RAY = "mentalray",
  STANDARD = "standard",
}

enum Form {
  SHAPE = "shape",
  RHOMBUS = "rhombus",
  LINE = "line",
  STAR = "star",
  HEXAGON = "hexagon",
  TRIANGLE = "triangle",
  RECTANGLE = "rectangle",
  SQUARE = "square",
  OVAL = "oval",
  CIRCLE = "circle",
}

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
  materials?: Material;
  style?: Style;
  render?: Render;
  form?: Form;
  color?: string;
  urlDownload?: string;
}

interface Category {
  _id: string;
  name: string;
  parentId?: string;
  path?: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const isCreating = id === "create";
  const pageTitle = isCreating ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm";

  // State for form
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    discount: 0,
    isActive: true,
    isPro: false,
    size: 0,
    categoryId: "",
    images: "",
  });

  // Create a custom hook for product data
  const useProductData = () => {
    // Always call the hook, but use the enabled option to conditionally fetch
    return useApiQuery<{ data: Product }>(
      ["product", id as string],
      `/products/${id}`,
      // @ts-expect-error - The useQuery hook accepts this option
      { enabled: !isCreating && !!id }
    );
  };

  // Fetch product data if editing
  const { data: productData, isLoading: isLoadingProduct } = useProductData();

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useApiQuery<{
    data: Category[];
  }>("categories", "/categories");

  // Update mutation
  const { mutate: updateProduct, isPending: isUpdating } = useApiMutation<
    { data: Product },
    Partial<Product>
  >(
    "product",
    isCreating ? "/products" : `/products/${id}`,
    isCreating ? "post" : "put"
  );

  // Set form data when product data is loaded
  useEffect(() => {
    if (productData?.data && !isCreating) {
      setFormData(productData.data);
    }
  }, [productData, isCreating]);

  // Handle form change
  const handleChange = (field: keyof Product, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateProduct(formData, {
      onSuccess: () => {
        toast.success(
          isCreating
            ? "Sản phẩm đã được tạo thành công"
            : "Sản phẩm đã được cập nhật thành công"
        );
        if (isCreating) {
          router.push("/dashboard/products");
        }
      },
      onError: (error) => {
        toast.error(`Lỗi: ${error.message}`);
      },
    });
  };

  // Loading state
  if (!isCreating && isLoadingProduct) {
    return (
      <div className="flex justify-center p-8">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <IconHome className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/products">Sản phẩm</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink>{pageTitle}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/products")}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="media">Hình ảnh & Tải xuống</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên sản phẩm</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Danh mục</Label>
                      <Select
                        value={formData.categoryId || ""}
                        onValueChange={(value) =>
                          handleChange("categoryId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <SelectItem value="loading" disabled>
                              Đang tải danh mục...
                            </SelectItem>
                          ) : (
                            categoriesData?.data.map((category) => (
                              <SelectItem
                                key={category._id}
                                value={category._id}
                              >
                                {category.path || category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Giá (coin)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price || 0}
                        onChange={(e) =>
                          handleChange("price", Number(e.target.value))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Giảm giá (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount || 0}
                        onChange={(e) =>
                          handleChange("discount", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Kích thước (MB)</Label>
                      <Input
                        id="size"
                        type="number"
                        min="0"
                        value={formData.size || 0}
                        onChange={(e) =>
                          handleChange("size", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          handleChange("isActive", !!checked)
                        }
                      />
                      <Label htmlFor="isActive">Hoạt động</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPro"
                        checked={formData.isPro}
                        onCheckedChange={(checked) =>
                          handleChange("isPro", !!checked)
                        }
                      />
                      <Label htmlFor="isPro">Sản phẩm PRO</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông số kỹ thuật</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materials">Chất liệu</Label>
                      <Select
                        value={formData.materials || ""}
                        onValueChange={(value) =>
                          handleChange("materials", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chất liệu" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(Material).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) +
                                key.slice(1).toLowerCase().replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Phong cách</Label>
                      <Select
                        value={formData.style || ""}
                        onValueChange={(value) => handleChange("style", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phong cách" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(Style).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) +
                                key.slice(1).toLowerCase().replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="render">Render</Label>
                      <Select
                        value={formData.render || ""}
                        onValueChange={(value) => handleChange("render", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn render" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(Render).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key
                                .replace("_", " ")
                                .replace(/([A-Z])/g, " $1")
                                .trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="form">Hình dạng</Label>
                      <Select
                        value={formData.form || ""}
                        onValueChange={(value) => handleChange("form", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn hình dạng" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(Form).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.charAt(0) +
                                key.slice(1).toLowerCase().replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Màu sắc</Label>
                      <Input
                        id="color"
                        value={formData.color || ""}
                        onChange={(e) => handleChange("color", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh & Tải xuống</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="images">URL Hình ảnh</Label>
                    <Input
                      id="images"
                      value={formData.images || ""}
                      onChange={(e) => handleChange("images", e.target.value)}
                      placeholder="Nhập URL hình ảnh"
                    />
                    {formData.images && (
                      <div className="mt-2 relative h-64">
                        <Image
                          src={formData.images}
                          alt={formData.name || "Product image"}
                          className="rounded-md object-contain"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={() => {
                            // Fallback handled via next.config.js unoptimized images
                            console.log("Image failed to load");
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="folderId">ID Thư mục</Label>
                    <Input
                      id="folderId"
                      value={formData.folderId || ""}
                      onChange={(e) => handleChange("folderId", e.target.value)}
                      placeholder="ID thư mục trên Google Drive"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlDownload">URL Tải xuống</Label>
                    <Input
                      id="urlDownload"
                      value={formData.urlDownload || ""}
                      onChange={(e) =>
                        handleChange("urlDownload", e.target.value)
                      }
                      placeholder="URL tải xuống trực tiếp"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/products")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
