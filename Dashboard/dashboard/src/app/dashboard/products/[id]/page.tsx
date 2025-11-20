"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome, IconPlus } from "@tabler/icons-react";
import { PageLoading } from "@/components/ui/loading";
import { ApiResponse } from "@/interface/pagination";
import Image from "next/image";
// import * as z from "zod";

// Mảng các vật liệu
const materials = [
  { id: "brick", name: "Brick" },
  { id: "ceramics", name: "Ceramics" },
  { id: "concrete", name: "Concrete" },
  { id: "fabric", name: "Fabric" },
  { id: "fur", name: "Fur" },
  { id: "glass", name: "Glass" },
  { id: "gypsum", name: "Gypsum" },
  { id: "leather", name: "Leather" },
  { id: "liquid", name: "Liquid" },
  { id: "metal", name: "Metal" },
  { id: "organics", name: "Organics" },
  { id: "paper", name: "Paper" },
  { id: "plastic", name: "Plastic" },
  { id: "rattan", name: "Rattan" },
  { id: "stone", name: "Stone" },
  { id: "wood", name: "Wood" },
];

// Mảng các phong cách
const styles = [
  { id: "luxury", name: "Luxury" },
  { id: "indochine", name: "Indochine" },
  { id: "ethnic", name: "Ethnic" },
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
];

// Mảng các render engine
const renderEngines = [
  { id: "vray+corona", name: "Vray + Corona" },
  { id: "corona", name: "Corona" },
  { id: "vray", name: "Vray" },
  { id: "mentalray", name: "Mental Ray" },
  { id: "standard", name: "Standard" },
];

// Mảng các hình dạng
const forms = [
  { id: "shape", name: "Shape", shape: "◊" },
  { id: "rhombus", name: "Rhombus", shape: "◇" },
  { id: "line", name: "Line", shape: "—" },
  { id: "star", name: "Star", shape: "☆" },
  { id: "hexagon", name: "Hexagon", shape: "⬡" },
  { id: "triangle", name: "Triangle", shape: "△" },
  { id: "rectangle", name: "Rectangle", shape: "▭" },
  { id: "square", name: "Square", shape: "□" },
  { id: "oval", name: "Oval", shape: "⬭" },
  { id: "circle", name: "Circle", shape: "○" },
];

// Mảng các màu sắc
const colors = [
  { hex: "#ffffff", name: "White" },
  { hex: "#6b7280", name: "Gray" },
  { hex: "#000000", name: "Black" },
  { hex: "#8b4513", name: "Brown" },
  { hex: "#dc2626", name: "Red" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
  { hex: "#f3e8d0", name: "Cream" },
  { hex: "#fbb6ce", name: "Pink" },
  { hex: "#d946ef", name: "Purple" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#10b981", name: "Green" },
  { hex: "#84cc16", name: "Lime" },
  { hex: "#65a30d", name: "Olive" },
];

// Zod schema for product validation (not used in this file but kept for reference)
// const productSchema = z.object({
//   name: z.string().min(1, "Tên sản phẩm không được để trống"),
//   description: z.string().optional(),
//   price: z.number().min(0, "Giá không được âm"),
//   discount: z.number().min(0, "Giảm giá không được âm").max(100, "Giảm giá tối đa 100%"),
//   folderId: z.string().optional(),
//   images: z.string().optional(),
//   isActive: z.boolean().default(true),
//   isPro: z.boolean().default(false),
//   stt: z.number().min(1, "STT phải lớn hơn 0"),
//   categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
//   materials: z.string().optional(),
//   style: z.string().optional(),
//   render: z.string().optional(),
//   form: z.string().optional(),
//   color: z.string().optional(),
//   platform: z.string().optional(),
//   urlDownload: z.string().optional(),
//   categoryName: z.string().optional(),
//   categoryPath: z.string().optional(),
//   rootCategoryId: z.string().optional(),
// });

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discount: number;
  folderId?: string;
  images: string;
  sold?: number;
  isActive: boolean;
  rating?: number;
  views?: number;
  likes?: number;
  isPro: boolean;
  size?: number;
  stt?: number;
  categoryId: string;
  categoryName: string;
  rootCategoryId?: string;
  categoryPath: string;
  materials?: string;
  style?: string;
  render?: string;
  form?: string;
  color?: string;
  platform?: string;
  urlDownload?: string;
}

// Type for product form
type ProductForm = {
  name: string;
  description?: string;
  price: number;
  discount: number;
  isActive: boolean;
  isPro: boolean;
  categoryId: string;
  categoryName?: string;
  categoryPath?: string;
  rootCategoryId?: string;
  images: string;
  folderId?: string;
  stt?: number;
  platform?: string;
  size?: number;
  materials?: string[];
  style?: string[];
  render?: string[];
  form?: string[];
  color?: string[];
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
  // const urlBE = process.env.NEXT_PUBLIC_IMAGE;

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for form
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    discount: 0,
    isActive: true,
    isPro: false,
    categoryId: "",
    images: "",
    platform: "3dsmax",
    materials: [],
    style: [],
    render: [],
    form: [],
    color: [],
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

  // Fetch categories for dropdown
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useApiQuery<ApiResponse<CategoryGroup[]>>("categories", "/categories/grouped");

  // Update mutation
  const { mutate: updateProduct, isPending: isUpdating } = useApiMutation<
    { data: Product },
    Partial<Product>
  >(
    "product",
    isCreating ? "/products" : `/products/${id}`,
    isCreating ? "post" : "patch"
  );

  // Set form data when product data is loaded
  useEffect(() => {
    if (productData?.data && !isCreating) {
      const product = productData.data;
      setFormData({
        ...product,
        // Convert string values to arrays for multi-select fields
        materials: product.materials ? [product.materials] : [],
        style: product.style ? [product.style] : [],
        render: product.render ? [product.render] : [],
        form: product.form ? [product.form] : [],
        color: product.color ? [product.color] : [],
        platform: product.platform || "3dsmax",
      });
    }
  }, [productData, isCreating]);

  // Handle form change
  const handleChange = (
    field: keyof ProductForm,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle category change specifically
  const handleCategoryChange = (value: string) => {
    const selectedCategory = findCategoryById(value);
    if (selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        categoryName: selectedCategory.name,
        categoryPath: selectedCategory.path,
        rootCategoryId: selectedCategory.rootId,
      }));
    }
  };

  // Helper function to find category by ID
  const findCategoryById = (categoryId: string) => {
    if (!categoriesData?.data) return null;

    for (const group of categoriesData.data) {
      // Check if it's a parent category
      if (group._id === categoryId) {
        return {
          name: group.title,
          path: group.title,
          rootId: group._id,
        };
      }

      // Check child categories
      for (const item of group.items) {
        if (item._id === categoryId) {
          return {
            name: item.name,
            path: `${group.title}`,
            rootId: group._id,
          };
        }
      }
    }
    return null;
  };

  // Handle checkbox change for materials, style, render, form, color
  const handleCheckboxChange = (
    field: "materials" | "style" | "render" | "form" | "color",
    itemId: string,
    checked: boolean
  ) => {
    if (!checked && formData[field]?.includes(itemId)) {
      return;
    }

    // Replace old value with new value (only allow one selection)
    if (checked) {
      setFormData((prev) => ({ ...prev, [field]: [itemId] }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert arrays back to strings for API
    const submitData = {
      ...formData,
      materials: formData.materials && formData.materials.length > 0 ? formData.materials[0] : undefined,
      style: formData.style && formData.style.length > 0 ? formData.style[0] : undefined,
      render: formData.render && formData.render.length > 0 ? formData.render[0] : undefined,
      form: formData.form && formData.form.length > 0 ? formData.form[0] : undefined,
      color: formData.color && formData.color.length > 0 ? formData.color[0] : undefined,
    };

    updateProduct(submitData, {
      onSuccess: () => {
        toast.success(
          isCreating
            ? "Sản phẩm đã được tạo thành công"
            : "Sản phẩm đã được cập nhật thành công"
        );
        router.push("/dashboard/products");
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
  if (isLoadingCategories || (!isCreating && isLoadingProduct)) {
    const text = isLoadingCategories
      ? "Đang tải danh mục..."
      : "Đang tải thông tin sản phẩm...";
    return <PageLoading text={text} />;
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

          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-orange-100 text-orange-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  Thông tin sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center">
                      <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        1.1
                      </span>
                      Tên sản phẩm
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <Label htmlFor="categoryId" className="text-sm font-medium flex items-center">
                      <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        1.2
                      </span>
                      Danh mục
                    </Label>
                    <Select
                      key={`category-${formData.categoryId || "empty"}`}
                      value={formData.categoryId || ""}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50">
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
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="text-xs text-orange-600 font-medium">
                          Đã chọn: {formData.categoryPath}
                          {formData.categoryName && ` > ${formData.categoryName}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center">
                    <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1.3
                    </span>
                    Mô tả
                  </Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium flex items-center">
                      <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        1.4
                      </span>
                      Giá (coin)
                    </Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price || 0}
                        onChange={(e) =>
                          handleChange("price", Number(e.target.value))
                        }
                        required
                        className="pl-7 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                        💰
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-sm font-medium flex items-center">
                      <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        1.5
                      </span>
                      Giảm giá (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount || 0}
                        onChange={(e) =>
                          handleChange("discount", Number(e.target.value))
                        }
                        className="pl-7 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-sm font-medium flex items-center">
                      <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        1.6
                      </span>
                      Kích thước (MB)
                    </Label>
                    <Input
                      id="size"
                      type="number"
                      min="0"
                      value={formData.size || 0}
                      onChange={(e) =>
                        handleChange("size", Number(e.target.value))
                      }
                      className="border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        handleChange("isActive", !!checked)
                      }
                      className="text-orange-500 focus:ring-orange-200"
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">Hoạt động</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPro"
                      checked={formData.isPro}
                      onCheckedChange={(checked) =>
                        handleChange("isPro", !!checked)
                      }
                      className="text-orange-500 focus:ring-orange-200"
                    />
                    <Label htmlFor="isPro" className="text-sm font-medium">Sản phẩm PRO</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <hr className="my-8 border-t border-gray-200" />

          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  Thông số kỹ thuật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-sm font-medium flex items-center">
                      <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.1
                      </span>
                      Platform
                    </Label>
                    <Input
                      id="platform"
                      value={formData.platform || "3dsmax"}
                      onChange={(e) => handleChange("platform", e.target.value)}
                      placeholder="Nhập platform (ví dụ: 3dsmax, Cinema 4D, Blender...)"
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Platform mặc định là 3dsmax
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stt" className="text-sm font-medium flex items-center">
                      <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.2
                      </span>
                      STT
                    </Label>
                    <Input
                      id="stt"
                      type="number"
                      min="1"
                      value={formData.stt || 1}
                      onChange={(e) => handleChange("stt", Number(e.target.value))}
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      placeholder="Nhập STT"
                    />
                  </div>
                </div>

                {/* Phong cách */}
                <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.3
                      </span>
                      Phong cách
                    </Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-200 bg-white">
                      {styles.map((style) => (
                        <label
                          key={style.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded min-w-[100px] w-auto"
                        >
                          <input
                            type="radio"
                            name="style"
                            checked={(formData.style || []).includes(style.id)}
                            onChange={(e) => handleCheckboxChange("style", style.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {style.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Render */}
                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <span className="bg-yellow-100 text-yellow-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.4
                      </span>
                      Render
                    </Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-200 bg-white">
                      {renderEngines.map((engine) => (
                        <label
                          key={engine.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded min-w-[120px] w-auto"
                        >
                          <input
                            type="radio"
                            name="render"
                            checked={(formData.render || []).includes(engine.id)}
                            onChange={(e) => handleCheckboxChange("render", engine.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {engine.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Màu sắc */}
                <div className="space-y-2 bg-purple-50 p-2 rounded-lg border border-purple-100">
                  <Label className="text-sm font-medium flex items-center">
                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      2.5
                    </span>
                    Màu sắc
                  </Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md border-gray-200 bg-white">
                    {colors.map((color) => (
                      <div key={color.hex} className="relative">
                        <label className="cursor-pointer">
                          <div
                            className={`w-6 h-6 rounded-full border transition-all ${
                              (formData.color || []).includes(color.hex)
                                ? "border-gray-800 scale-110"
                                : "border-gray-300 hover:border-gray-400"
                            } ${
                              color.hex === "#ffffff"
                                ? "border-gray-400"
                                : ""
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            <input
                              type="radio"
                              name="color"
                              className="opacity-0 absolute"
                              checked={(formData.color || []).includes(color.hex)}
                              onChange={(e) => handleCheckboxChange("color", color.hex, e.target.checked)}
                            />
                            {(formData.color || []).includes(color.hex) && (
                              <span
                                className={`absolute inset-0 flex items-center justify-center text-[10px] ${
                                  color.hex === "#ffffff" ||
                                  color.hex === "#f3e8d0" ||
                                  color.hex === "#fbb6ce"
                                    ? "text-black"
                                    : "text-white"
                                }`}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chất liệu */}
                <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.6
                      </span>
                      Chất liệu
                    </Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-200 bg-white">
                      {materials.map((material) => (
                        <label
                          key={material.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded min-w-[100px] w-auto"
                        >
                          <input
                            type="radio"
                            name="materials"
                            checked={(formData.materials || []).includes(material.id)}
                            onChange={(e) => handleCheckboxChange("materials", material.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {material.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hình dạng */}
                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <span className="bg-yellow-100 text-yellow-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                        2.7
                      </span>
                      Hình dạng
                    </Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-200 bg-white">
                      {forms.map((form) => (
                        <div key={form.id} className="text-center">
                          <label className="flex flex-col items-center space-y-1 cursor-pointer hover:bg-gray-50 p-1 rounded min-w-[50px] w-auto">
                            <input
                              type="radio"
                              name="form"
                              checked={(formData.form || []).includes(form.id)}
                              onChange={(e) => handleCheckboxChange("form", form.id, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded-full focus:ring-blue-500"
                            />
                            <span className="text-lg">
                              {form.shape}
                            </span>
                            <span className="text-xs text-gray-700">
                              {form.name}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <hr className="my-8 border-t border-gray-200" />

          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-purple-100 text-purple-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  Hình ảnh & Tải xuống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <Label htmlFor="images" className="text-sm font-medium flex items-center">
                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3.1
                    </span>
                    URL Hình ảnh
                  </Label>
                  <Input
                    id="images"
                    value={formData.images || ""}
                    onChange={(e) => handleChange("images", e.target.value)}
                    placeholder="Nhập URL hình ảnh"
                    className="border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  {formData.images && (
                    <div className="mt-2 border border-purple-200 rounded-md overflow-hidden bg-white">
                      <div className="relative h-64">
                        <Image
                          src={formData.images}
                          alt={formData.name || "Product image"}
                          className="object-contain"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={() => {
                            console.log("Image failed to load");
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <Label htmlFor="folderId" className="text-sm font-medium flex items-center">
                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3.2
                    </span>
                    ID Thư mục Google Drive
                  </Label>
                  <div className="relative">
                    <Input
                      id="folderId"
                      value={formData.folderId || ""}
                      onChange={(e) => handleChange("folderId", e.target.value)}
                      placeholder="Nhập ID folder Google Drive"
                      className="pl-9 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      📁
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <Label htmlFor="urlDownload" className="text-sm font-medium flex items-center">
                    <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3.3
                    </span>
                    URL Tải xuống
                  </Label>
                  <Input
                    id="urlDownload"
                    value={formData.urlDownload || ""}
                    onChange={(e) =>
                      handleChange("urlDownload", e.target.value)
                    }
                    placeholder="URL tải xuống trực tiếp"
                    className="border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
            type="button"
            className="px-5"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white px-5"
          >
            {isUpdating ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center">
                <IconPlus className="mr-2 h-4 w-4" />
                {isCreating ? "Tạo sản phẩm" : "Cập nhật sản phẩm"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
