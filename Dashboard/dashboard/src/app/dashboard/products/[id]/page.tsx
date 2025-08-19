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
import { Loading } from "@/components/ui/loading";

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

interface CategoryItem {
  _id: string;
  name: string;
  parentId?: string;
}

interface CategoryGroup {
  _id: string;
  title: string; // Tên danh mục cha
  items: CategoryItem[]; // Danh sách danh mục con
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const isCreating = id === "create";
  const pageTitle = isCreating ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm";

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

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
    materials: undefined,
    style: undefined,
    render: undefined,
    form: undefined,
    color: "",
  });

  // Fetch product data if editing
  const {
    data: productData,
    isLoading: isLoadingProduct,
    error: productError,
  } = useApiQuery<{ data: Product }>(
    ["product", id as string],
    `/products/${id}`,
    { enabled: !isCreating && !!id }
  );

  // Fetch categories for dropdown - using grouped categories like batch-create
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useApiQuery<{
    data: CategoryGroup[];
  }>("categories", "/categories/grouped");

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

  // Handle form change with proper type checking
  const handleChange = (field: keyof Product, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle category change specifically
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value }));
  };

  // Handle enum field changes
  const handleMaterialsChange = (value: string) => {
    setFormData((prev) => ({ ...prev, materials: value as Material }));
  };

  const handleStyleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, style: value as Style }));
  };

  const handleRenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, render: value as Render }));
  };

  const handleFormChange = (value: string) => {
    setFormData((prev) => ({ ...prev, form: value as Form }));
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

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (!isCreating && isLoadingProduct) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          <Loading size="sm" variant="spinner" />
        </div>
      </div>
    );
  }

  // Error state for product loading
  if (!isCreating && productError) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          Lỗi tải thông tin sản phẩm: {productError.message}
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
                      key={`category-${formData.categoryId || "empty"}`}
                      value={formData.categoryId || ""}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 w-full">
                        {isLoadingCategories ? (
                          <SelectItem value="loading" disabled>
                            Đang tải danh mục...
                          </SelectItem>
                        ) : categoriesError ? (
                          <SelectItem value="error" disabled>
                            Lỗi tải danh mục
                          </SelectItem>
                        ) : (
                          categoriesData?.data.map((group) => (
                            <div key={group._id} className="mb-2">
                              {/* Danh mục cha */}
                              <SelectItem
                                key={`parent-${group._id}`}
                                value={group._id}
                                className="bg-muted font-semibold"
                              >
                                {group.title}
                              </SelectItem>

                              {/* Danh mục con - hiển thị thụt vào */}
                              <div className="pl-4">
                                {group.items.map((category) => (
                                  <SelectItem
                                    key={category._id}
                                    value={category._id}
                                    className="text-sm"
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Display selected category info */}
                    {formData.categoryPath && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-xs text-blue-600 font-medium">
                          Đã chọn: {formData.categoryPath}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Category ID: {formData.categoryId}
                        </div>
                        <div className="text-xs text-blue-500">
                          Root Category ID: {formData.rootCategoryId}
                        </div>
                      </div>
                    )}
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
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md border-gray-200 bg-white">
                      {Object.entries(Material).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="materials"
                            checked={formData.materials === value}
                            onChange={() => handleMaterialsChange(value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {key.charAt(0) +
                              key.slice(1).toLowerCase().replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Phong cách</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md border-gray-200 bg-white">
                      {Object.entries(Style).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="style"
                            checked={formData.style === value}
                            onChange={() => handleStyleChange(value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {key.charAt(0) +
                              key.slice(1).toLowerCase().replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="render">Render</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md border-gray-200 bg-white">
                      {Object.entries(Render).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="render"
                            checked={formData.render === value}
                            onChange={() => handleRenderChange(value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {key
                              .replace("_", " ")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="form">Hình dạng</Label>
                    <div className="grid grid-cols-5 gap-2 p-3 border rounded-md border-gray-200 bg-white">
                      {Object.entries(Form).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex flex-col items-center justify-center space-y-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="radio"
                            name="form"
                            checked={formData.form === value}
                            onChange={() => handleFormChange(value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="w-6 h-6 border border-gray-300 rounded-md flex items-center justify-center text-xs">
                            {value.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-700 text-center">
                            {key.charAt(0) +
                              key.slice(1).toLowerCase().replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Màu sắc</Label>
                    <div className="grid grid-cols-4 gap-2 p-3 border rounded-md border-gray-200 bg-white">
                      {[
                        { hex: "#ffffff", name: "White" },
                        { hex: "#6b7280", name: "Gray" },
                        { hex: "#ef4444", name: "Red" },
                        { hex: "#f59e0b", name: "Orange" },
                        { hex: "#eab308", name: "Yellow" },
                        { hex: "#10b981", name: "Green" },
                        { hex: "#3b82f6", name: "Blue" },
                        { hex: "#8b5cf6", name: "Purple" },
                        { hex: "#ec4899", name: "Pink" },
                        { hex: "#000000", name: "Black" },
                        { hex: "#7c2d12", name: "Brown" },
                        { hex: "#0d9488", name: "Teal" },
                      ].map((color) => (
                        <label
                          key={color.hex}
                          className="flex flex-col items-center space-y-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="color"
                            checked={
                              formData.color === color.name.toLowerCase()
                            }
                            onChange={() =>
                              handleChange("color", color.name.toLowerCase())
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-8 h-8 rounded-full border ${
                              formData.color === color.name.toLowerCase()
                                ? "ring-2 ring-blue-500"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color.hex }}
                          >
                            {formData.color === color.name.toLowerCase() && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill={
                                  color.hex === "#ffffff"
                                    ? "#000000"
                                    : "#ffffff"
                                }
                                className="w-full h-full p-1.5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs text-gray-700">
                            {color.name}
                          </span>
                        </label>
                      ))}
                    </div>
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
  );
}
