"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
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
import {
  IconHome,
  IconPlus,
  IconTrash,
  IconUpload,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiResponse } from "@/interface/pagination";
import * as z from "zod";
import { PageLoading } from "@/components/ui/loading";
import Image from "next/image";

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

// Zod schema for product validation
// eslint-disable-next-line
const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  description: z.string().optional(),
  price: z.number().min(0, "Giá không được âm"),
  discount: z
    .number()
    .min(0, "Giảm giá không được âm")
    .max(100, "Giảm giá tối đa 100%"),
  folderId: z.string().optional(),
  images: z.string().optional(),
  isActive: z.boolean().default(true),
  isPro: z.boolean().default(false),
  stt: z.number().min(1, "STT phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  materials: z.nativeEnum(Material).optional(),
  style: z.nativeEnum(Style).optional(),
  render: z.nativeEnum(Render).optional(),
  form: z.nativeEnum(Form).optional(),
  color: z.string().optional(),
  urlDownload: z.string().optional(),
  categoryName: z.string().optional(),
  categoryPath: z.string().optional(),
  rootCategoryId: z.string().optional(),
});

// Type for a single product form
type ProductForm = z.infer<typeof productSchema>;

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

interface FileWithPreview extends File {
  preview: string;
}

export default function BatchCreateProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("0");
  const [products, setProducts] = useState<ProductForm[]>([getEmptyProduct()]);
  const [files, setFiles] = useState<(FileWithPreview | null)[]>([null]);
  const [sharedFolderId, setSharedFolderId] = useState("");
  const [sharedProductName, setSharedProductName] = useState("");
  // Simple ref for file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useApiQuery<
    ApiResponse<CategoryGroup[]>
  >("categories", "/categories/grouped");

  // Create multiple products mutation
  const { mutate: createProducts, isPending: isCreating } = useApiMutation<
    { data: { success: boolean; message: string } },
    FormData
  >("products", "/products/batch-with-images", "post");

  // Function to get an empty product form
  function getEmptyProduct(): ProductForm {
    return {
      name: "",
      description: "",
      price: 0,
      discount: 0,
      isActive: true,
      isPro: false,
      categoryId: "",
      categoryName: "",
      categoryPath: "",
      rootCategoryId: "",
      images: "",
      stt: 1,
      materials: undefined,
      style: undefined,
      render: undefined,
      form: undefined,
      color: "",
    };
  }

  // Handle adding a new product form
  const handleAddProduct = (): void => {
    const newProducts = [...products, getEmptyProduct()];
    setProducts(newProducts);
    setFiles([...files, null]);

    // Switch to the new tab - use flushSync to ensure DOM updates are synchronized
    const newTabIndex = (newProducts.length - 1).toString();
    setActiveTab(newTabIndex);
  };

  // Handle removing a product form
  const handleRemoveProduct = (index: number): void => {
    if (products.length <= 1) {
      toast.error("Phải có ít nhất một sản phẩm");
      return;
    }

    // Clean up file preview if exists
    if (files[index]) {
      URL.revokeObjectURL(files[index]!.preview);
    }

    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);

    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    // If we removed the active tab, switch to the previous tab
    if (parseInt(activeTab) >= newProducts.length) {
      setActiveTab((newProducts.length - 1).toString());
    }
  };

  // Handle file selection
  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      const newFiles = [...files];
      newFiles[index] = fileWithPreview;
      setFiles(newFiles);

      // Clear the input value to allow selecting the same file again
      e.target.value = "";
    }
  };

  // Handle file removal
  const handleFileRemove = (index: number): void => {
    if (files[index]) {
      URL.revokeObjectURL(files[index]!.preview);
    }

    const newFiles = [...files];
    newFiles[index] = null;
    setFiles(newFiles);

    // Clear the file input safely
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const triggerFileInput = (index: number): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form change for a specific product
  const handleChange = (
    index: number,
    field: keyof ProductForm,
    value: unknown
  ): void => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };

    // If categoryId is changed, update related category fields
    if (field === "categoryId" && typeof value === "string") {
      const selectedCategory = findCategoryById(value);
      if (selectedCategory) {
        newProducts[index] = {
          ...newProducts[index],
          categoryId: value,
          categoryName: selectedCategory.name,
          categoryPath: selectedCategory.path,
          rootCategoryId: selectedCategory.rootId,
        };
      }
    }

    setProducts(newProducts);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    // Validate shared folder ID and product name
    if (!sharedFolderId.trim()) {
      toast.error("Vui lòng nhập ID Folder Google Drive");
      return;
    }

    if (!sharedProductName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    // Validate required fields
    const invalidProducts = products.filter(
      (product, index) =>
        !product.categoryId ||
        product.price <= 0 ||
        !product.stt ||
        product.stt < 1 ||
        !files[index]
    );

    if (invalidProducts.length > 0) {
      toast.error(
        `${invalidProducts.length} sản phẩm có thông tin không hợp lệ`
      );
      return;
    }

    // Apply shared folder ID and product name to all products
    const productsWithFolderId = products.map((product) => ({
      ...product,
      folderId: sharedFolderId,
      name: sharedProductName,
    }));

    // Create FormData to send files and product data
    const formData = new FormData();

    // Add each product as a JSON string
    formData.append("products", JSON.stringify(productsWithFolderId));

    // Add each file with index as key
    files.forEach((file, index) => {
      if (file) {
        formData.append(`file-${index}`, file);
      }
    });

    createProducts(formData, {
      onSuccess: () => {
        toast.success(`Đã tạo thành công ${products.length} sản phẩm`);
        router.push("/dashboard/products");
      },
      onError: (error) => {
        toast.error(`Lỗi: ${error.message}`);
      },
    });
  };

  // Loading state
  if (isLoadingCategories) {
    return <PageLoading text="Đang tải danh mục..." />;
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
          <span className="mx-2 text-gray-400">&gt;</span>

          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/products">Sản phẩm</BreadcrumbLink>
          </BreadcrumbItem>
          <span className="mx-2 text-gray-400">&gt;</span>

          <BreadcrumbItem>
            <BreadcrumbLink>Tạo nhiều sản phẩm</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tạo nhiều sản phẩm</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/products")}
              type="button"
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating} type="button">
              {isCreating ? "Đang lưu..." : "Lưu tất cả sản phẩm"}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium flex items-center">
            <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-5 h-5 rounded-full mr-2 text-xs font-bold">
              {products.length}
            </span>
            sản phẩm đang được tạo
          </div>
          <Button
            onClick={handleAddProduct}
            variant="outline"
            size="sm"
            type="button"
            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 hover:border-green-300"
          >
            <IconPlus className="h-4 w-4 mr-1.5" />
            Thêm sản phẩm
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Shared Folder ID Section */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="bg-orange-100 text-orange-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                  📁
                </div>
                Thông tin chung cho tất cả sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="shared-folder-id"
                    className="text-sm font-medium flex items-center"
                  >
                    <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      📁
                    </span>
                    ID Folder Google Drive (dùng chung)
                  </Label>
                  <div className="relative">
                    <Input
                      id="shared-folder-id"
                      value={sharedFolderId}
                      onChange={(e) => setSharedFolderId(e.target.value)}
                      placeholder="Nhập ID folder Google Drive (sẽ áp dụng cho tất cả sản phẩm)"
                      className="pl-9 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      📁
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    ID folder này sẽ được áp dụng cho tất cả {products.length}{" "}
                    sản phẩm
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="shared-product-name"
                    className="text-sm font-medium flex items-center"
                  >
                    <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      📦
                    </span>
                    Tên sản phẩm (dùng chung)
                  </Label>
                  <div className="relative">
                    <Input
                      id="shared-product-name"
                      value={sharedProductName}
                      onChange={(e) => setSharedProductName(e.target.value)}
                      placeholder="Nhập tên sản phẩm (sẽ áp dụng cho tất cả sản phẩm)"
                      className="pl-9 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      📦
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Tên sản phẩm này sẽ được áp dụng cho tất cả{" "}
                    {products.length} sản phẩm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap bg-gray-100 p-1 rounded-lg">
              {products.map((_, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="relative rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-[120px] py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center font-medium text-xs">
                      {index + 1}
                    </div>
                    <span>Sản phẩm {index + 1}</span>
                  </div>
                  {products.length > 1 && (
                    <span
                      role="button"
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProduct(index);
                      }}
                    >
                      <IconTrash className="h-3 w-3" />
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {products.map((product, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      Thông tin sản phẩm {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`stt-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            1
                          </span>
                          STT
                        </Label>
                        <Input
                          id={`stt-${index}`}
                          type="number"
                          min="1"
                          value={product.stt || 1}
                          onChange={(e) =>
                            handleChange(index, "stt", Number(e.target.value))
                          }
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          placeholder="Nhập STT"
                        />
                      </div>

                      <div className="space-y-2 w-full">
                        <Label
                          htmlFor={`categoryId-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            2
                          </span>
                          Danh mục
                        </Label>
                        <Select
                          value={product.categoryId || ""}
                          onValueChange={(value) =>
                            handleChange(index, "categoryId", value)
                          }
                        >
                          <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80 w-full">
                            {categoriesData?.data.map((group) => (
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
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Display selected category info */}
                        {product.categoryPath && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-xs text-blue-600 font-medium">
                              Đã chọn: {product.categoryPath}
                            </div>
                            <div className="text-xs text-blue-500 mt-1">
                              Category ID: {product.categoryId}
                            </div>
                            <div className="text-xs text-blue-500">
                              Root Category ID: {product.rootCategoryId}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <Label
                        htmlFor={`description-${index}`}
                        className="text-sm font-medium flex items-center"
                      >
                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                          3
                        </span>
                        Mô tả
                      </Label>
                      <textarea
                        id={`description-${index}`}
                        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        value={product.description || ""}
                        onChange={(e) =>
                          handleChange(index, "description", e.target.value)
                        }
                        placeholder="Nhập mô tả chi tiết về sản phẩm..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`price-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            4
                          </span>
                          Giá (coin)
                        </Label>
                        <div className="relative">
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            value={product.price || 0}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "price",
                                Number(e.target.value)
                              )
                            }
                            required
                            className="pl-7 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                            💰
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`discount-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            5
                          </span>
                          Giảm giá (%)
                        </Label>
                        <div className="relative">
                          <Input
                            id={`discount-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={product.discount || 0}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "discount",
                                Number(e.target.value)
                              )
                            }
                            className="pl-7 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium flex items-center mr-2">
                          <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            6
                          </span>
                          Trạng thái
                        </Label>
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-200">
                          <Checkbox
                            id={`isActive-${index}`}
                            checked={product.isActive}
                            onCheckedChange={(checked) =>
                              handleChange(index, "isActive", !!checked)
                            }
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <Label
                            htmlFor={`isActive-${index}`}
                            className="cursor-pointer"
                          >
                            Hoạt động
                          </Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-200">
                          <Checkbox
                            id={`isPro-${index}`}
                            checked={product.isPro}
                            onCheckedChange={(checked) =>
                              handleChange(index, "isPro", !!checked)
                            }
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <Label
                            htmlFor={`isPro-${index}`}
                            className="cursor-pointer"
                          >
                            Sản phẩm PRO
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`materials-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            7
                          </span>
                          Chất liệu
                        </Label>
                        <Select
                          value={product.materials || ""}
                          onValueChange={(value) =>
                            handleChange(index, "materials", value)
                          }
                        >
                          <SelectTrigger className="border-gray-300 w-full focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
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
                        <Label
                          htmlFor={`style-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            8
                          </span>
                          Phong cách
                        </Label>
                        <Select
                          value={product.style || ""}
                          onValueChange={(value) =>
                            handleChange(index, "style", value)
                          }
                        >
                          <SelectTrigger className="border-gray-300 w-full focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`render-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-yellow-100 text-yellow-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            9
                          </span>
                          Render
                        </Label>
                        <Select
                          value={product.render || ""}
                          onValueChange={(value) =>
                            handleChange(index, "render", value)
                          }
                        >
                          <SelectTrigger className="border-gray-300 w-full focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50">
                            <SelectValue placeholder="Chọn loại render" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(Render).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {key.charAt(0) +
                                  key
                                    .slice(1)
                                    .toLowerCase()
                                    .replace("_", " ")
                                    .replace("+", " + ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`form-${index}`}
                          className="text-sm font-medium flex items-center"
                        >
                          <span className="bg-yellow-100 text-yellow-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            10
                          </span>
                          Hình dạng
                        </Label>
                        <Select
                          value={product.form || ""}
                          onValueChange={(value) =>
                            handleChange(index, "form", value)
                          }
                        >
                          <SelectTrigger className="border-gray-300 w-full focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50">
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
                    </div>

                    <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <Label
                        htmlFor={`color-${index}`}
                        className="text-sm font-medium flex items-center"
                      >
                        <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                          11
                        </span>
                        Màu sắc
                      </Label>
                      <div className="relative">
                        <Input
                          id={`color-${index}`}
                          value={product.color || ""}
                          onChange={(e) =>
                            handleChange(index, "color", e.target.value)
                          }
                          placeholder="Nhập màu sắc"
                          className="pl-9 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          🎨
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <Label className="text-sm font-medium flex items-center">
                        <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                          13
                        </span>
                        Hình ảnh sản phẩm
                      </Label>

                      <input
                        type="file"
                        id={`file-input-${index}`}
                        accept="image/*"
                        onChange={(e) => handleFileChange(index, e)}
                        className="hidden"
                        ref={fileInputRef}
                      />

                      {!files[index] ? (
                        <div
                          onClick={() => triggerFileInput(index)}
                          className="border-2 border-dashed border-indigo-300 rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-100/50 transition-colors"
                        >
                          <IconUpload className="h-10 w-10 text-indigo-500" />
                          <div className="text-center">
                            <p className="font-medium text-indigo-600">
                              Nhấn để tải lên hình ảnh
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              PNG, JPG hoặc GIF (tối đa 5MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="rounded-lg overflow-hidden border border-indigo-200">
                            <Image
                              src={files[index]!.preview}
                              alt="Preview"
                              className="w-full h-48 object-contain"
                            />
                          </div>
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => triggerFileInput(index)}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-1.5 shadow-sm transition-colors"
                              title="Thay đổi hình ảnh"
                            >
                              <IconPhoto className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFileRemove(index)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-sm transition-colors"
                              title="Xóa hình ảnh"
                            >
                              <IconX className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            {files[index]!.name} (
                            {(files[index]!.size / 1024 / 1024).toFixed(2)}MB)
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

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
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700 text-white px-5"
            >
              {isCreating ? (
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
                  Lưu tất cả sản phẩm
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
