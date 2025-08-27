"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
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
import { IconHome, IconPlus, IconTrash } from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiResponse } from "@/interface/pagination";
import Image from "next/image";

// Define API response types

import * as z from "zod";
import { PageLoading } from "@/components/ui/loading";
// Image import removed as we're not displaying images anymore

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
  materials: z.string().optional(),
  style: z.string().optional(),
  render: z.string().optional(),
  form: z.string().optional(),
  color: z.string().optional(),
  platform: z.string().optional(), // Added platform field
  urlDownload: z.string().optional(),
  categoryName: z.string().optional(),
  categoryPath: z.string().optional(),
  rootCategoryId: z.string().optional(),
});

// Type for a single product form
type ProductForm = Omit<
  z.infer<typeof productSchema>,
  "materials" | "style" | "render" | "form" | "color"
> & {
  materials: string[];
  style: string[];
  render: string[];
  form: string[];
  color: string[];
  platform: string;
};

type CreateProductDto = z.infer<typeof productSchema>;

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

// FileWithPreview interface removed as we're not uploading images anymore

export default function BatchCreateProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("0");
  // Files are no longer needed since we're not uploading images
  const [sharedFolderId, setSharedFolderId] = useState("");
  // State để lưu trữ URL ảnh preview cho mỗi sản phẩm
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>(
    {}
  );
  // State để theo dõi các sản phẩm mới thêm vào để không bị ghi đè STT
  const [newProductIndexes, setNewProductIndexes] = useState<Set<number>>(new Set());
  const urlBE = process.env.NEXT_PUBLIC_IMAGE;

  // State để theo dõi sản phẩm nào đang tải ảnh
  const [loadingImages, setLoadingImages] = useState<{
    [key: string]: boolean;
  }>({});

  // State để theo dõi sản phẩm nào đã gặp lỗi khi tải ảnh
  const [failedImages, setFailedImages] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useApiQuery<
    ApiResponse<CategoryGroup[]>
  >("categories", "/categories/grouped");

  // Create multiple products mutation
  const { mutate: createProducts, isPending: isCreating } = useApiMutation<
    { data: { success: boolean; message: string } },
    { products: CreateProductDto[] }
  >("products", "/products/batch-with-images", "post");

  const { mutate: searchImage } = useApiMutation<
    { data: { url: string; name: string; id: string; localPath: string } },
    { searchTerm: string; folderId: string }
  >("products", "/products/search-image", "post");

  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<
    string | null
  >(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Get the last STT when a category is selected
  const {
    data: lastSttData,
    isLoading: isLoadingLastStt,
    refetch: refetchLastStt,
  } = useApiQuery<ApiResponse<number>>(
    "products",
    `/products/last-stt/${selectedRootCategoryId}/${selectedCategoryId}`,
    {
      enabled: !!selectedRootCategoryId && !!selectedCategoryId,
    }
  );

  // Function to get an empty product form
  function getEmptyProduct(): ProductForm {
    // Tìm thông tin danh mục chung nếu đã chọn
    let categoryId = "";
    let categoryName = "";
    let categoryPath = "";
    let rootCategoryId = "";

    if (selectedRootCategoryId) {
      const apiData = categoriesData as unknown as ApiResponse<CategoryGroup[]>;
      if (apiData?.data) {
        let found = false;

        // Tìm trong danh sách danh mục
        for (const group of apiData.data) {
          // Kiểm tra nếu là danh mục cha
          if (group._id === selectedRootCategoryId) {
            categoryId = selectedRootCategoryId;
            categoryName = group.title;
            categoryPath = group.title;
            rootCategoryId = group._id;
            found = true;
            break;
          }

          // Kiểm tra trong danh mục con
          if (!found) {
            for (const category of group.items) {
              if (category._id === selectedRootCategoryId) {
                categoryId = selectedRootCategoryId;
                categoryName = category.name;
                categoryPath = group.title;
                rootCategoryId = group._id;
                found = true;
                break;
              }
            }
          }

          if (found) break;
        }
      }
    }

    return {
      name: categoryName ? `${categoryName}` : "",
      description: "",
      price: 0,
      discount: 0,
      isActive: true,
      isPro: false,
      categoryId: categoryId,
      categoryName: categoryName,
      categoryPath: categoryPath,
      rootCategoryId: rootCategoryId,
      images: "",
      platform: "3dsmax", // Default platform
      stt: 1,
      materials: [],
      style: [],
      render: [],
      form: [],
      color: [],
    };
  }

  // Initialize products state with an empty product
  const [products, setProducts] = useState<ProductForm[]>([getEmptyProduct()]);

  // Hàm tải ảnh preview dựa trên tên và STT của sản phẩm
  const loadPreviewImage = useCallback(
    (index: number) => {
      const product = products[index];
      // Kiểm tra xem có đủ thông tin để tìm ảnh không
      if (!sharedFolderId || !product?.stt || !product?.categoryName) {
        return;
      }

      // Kiểm tra xem ảnh đã đang được tải hay chưa
      // if (loadingImages[index]) {
      //   return;
      // }

      // Kiểm tra xem ảnh đã từng gặp lỗi khi tải chưa
      if (failedImages[index]) {
        return;
      }

      // Tạo searchTerm dựa trên STT và tên danh mục
      const updateStt =
        Number(product.stt) < 10 ? `0${product.stt}` : `${product.stt}`;
      const searchTerm = `${updateStt}. ${product.categoryName}`;

      // Đánh dấu sản phẩm này đang tải ảnh
      setLoadingImages((prev) => ({ ...prev, [index]: true }));

      // Gọi API để tìm ảnh
      searchImage(
        { searchTerm, folderId: sharedFolderId },
        {
          onSuccess: (response) => {
            // Lưu URL ảnh vào state
            setPreviewImages((prev) => ({
              ...prev,
              [index]: response.data.localPath,
            }));

            // Đánh dấu đã tải xong
            setLoadingImages((prev) => ({ ...prev, [index]: false }));

            // Đánh dấu không còn lỗi nữa (nếu trước đó đã gặp lỗi)
            if (failedImages[index]) {
              setFailedImages((prev) => ({ ...prev, [index]: false }));
            }
          },
          onError: (error) => {
            console.error("Lỗi khi tải ảnh preview:", error);
            toast.error(`Không thể tải ảnh preview: ${error.message}`);

            // Đánh dấu đã tải xong
            setLoadingImages((prev) => ({ ...prev, [index]: false }));

            // Đánh dấu sản phẩm này đã gặp lỗi khi tải ảnh
            setFailedImages((prev) => ({ ...prev, [index]: true }));
          },
        }
      );
    },
    [products, sharedFolderId, searchImage, failedImages]
  );

  // Update the current product's STT when we get new data from the API
  // Effect to update STT when lastSttData changes
  useEffect(() => {
    if (lastSttData?.data && activeTab) {
      const index = parseInt(activeTab);
      
      // Skip STT update for newly added products
      if (newProductIndexes.has(index)) {
        return;
      }
      
      const lastStt = lastSttData.data;
      const nextStt = lastStt + 1;

      // Kiểm tra xem STT hiện tại có khác với STT mới không
      const currentStt = products[index]?.stt;
      if (currentStt !== nextStt) {
        // Update the STT for the current product
        setProducts((prevProducts) => {
          const newProducts = [...prevProducts];
          newProducts[index] = { ...newProducts[index], stt: nextStt };
          return newProducts;
        });

        // Tự động tải ảnh preview sau khi STT được cập nhật - dùng requestAnimationFrame để đảm bảo state đã được cập nhật
        if (sharedFolderId && !failedImages[index]) {
          // Sử dụng ref để theo dõi việc tải ảnh
          const timeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
              loadPreviewImage(index);
            });
          }, 500);

          // Cleanup function
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [
    lastSttData,
    activeTab,
    sharedFolderId,
    loadPreviewImage,
    products,
    failedImages,
    newProductIndexes, // Add newProductIndexes to dependencies
  ]);

  // Effect để tải ảnh preview khi sharedFolderId thay đổi
  useEffect(() => {
    // Chỉ chạy khi sharedFolderId thay đổi, không phải khi activeTab hoặc products thay đổi
    if (sharedFolderId && products.length > 0) {
      // Sử dụng ref để kiểm tra xem đây có phải là lần đầu tiên sharedFolderId thay đổi không
      const currentIndex = parseInt(activeTab);
      const product = products[currentIndex];

      // Chỉ tải ảnh nếu sản phẩm hiện tại chưa có ảnh và có đủ thông tin
      if (
        product &&
        product.stt &&
        product.categoryName &&
        !previewImages[currentIndex] &&
        !loadingImages[currentIndex] &&
        !failedImages[currentIndex] // Không tải lại nếu đã từng gặp lỗi
      ) {
        // Sử dụng requestAnimationFrame để đảm bảo state đã được cập nhật
        const timeoutId = setTimeout(() => {
          requestAnimationFrame(() => {
            loadPreviewImage(currentIndex);
          });
        }, 300);

        // Cleanup function
        return () => clearTimeout(timeoutId);
      }
    }
  }, [
    sharedFolderId,
    activeTab,
    loadPreviewImage,
    loadingImages,
    previewImages,
    products,
    failedImages, // Thêm failedImages vào dependencies
  ]);

  // Effect to refetch last STT when selectedCategoryId changes
  useEffect(() => {
    if (selectedRootCategoryId && selectedCategoryId) {
      refetchLastStt();
    }
  }, [selectedCategoryId, selectedRootCategoryId, refetchLastStt]);

  // Handle adding a new product form
  const handleAddProduct = (): void => {
    // Get the last product's STT and increment it for the new product
    const lastProductStt =
      products.length > 0 ? products[products.length - 1].stt : 0;
    const newProductStt = lastProductStt + 1;

    // Create new product with incremented STT
    const newProduct = getEmptyProduct();
    newProduct.stt = newProductStt;

    const newProducts = [...products, newProduct];
    
    // Get the index of the new product
    const newIndex = newProducts.length - 1;
    
    // Mark this product as newly added to prevent STT overriding
    setNewProductIndexes(prev => {
      const updated = new Set(prev);
      updated.add(newIndex);
      return updated;
    });
    
    // Update products state and switch to the new tab
    setProducts(newProducts);
    setActiveTab(newIndex.toString());
    
    // Sau khi thêm sản phẩm mới, chờ state được cập nhật rồi tải ảnh preview chỉ cho tab mới
    if (sharedFolderId && newProduct.categoryName) {
      // Sử dụng thời gian chờ dài hơn để đảm bảo state đã được cập nhật
      setTimeout(() => {
        // Chỉ tải ảnh cho tab mới
        loadPreviewImage(newIndex);
      }, 800);
      
      // Thêm một lần tải ảnh nữa sau thời gian dài hơn để đảm bảo ảnh được tải
      setTimeout(() => {
        if (!previewImages[newIndex] && !loadingImages[newIndex]) {
          loadPreviewImage(newIndex);
        }
      }, 2000);
    }
  };

  // Handle removing a product form
  const handleRemoveProduct = (index: number): void => {
    if (products.length <= 1) {
      toast.error("Phải có ít nhất một sản phẩm");
      return;
    }

    const newProducts = [...products];
    newProducts.splice(index, 1);
    
    // Update the newProductIndexes set to reflect the removed product
    setNewProductIndexes(prev => {
      const updated = new Set<number>();
      
      // Rebuild the set with adjusted indexes
      prev.forEach(prevIndex => {
        if (prevIndex < index) {
          // Indexes before the removed one stay the same
          updated.add(prevIndex);
        } else if (prevIndex > index) {
          // Indexes after the removed one need to be decremented
          updated.add(prevIndex - 1);
        }
        // The index that was removed is not added to the new set
      });
      
      return updated;
    });
    
    setProducts(newProducts);

    // If we removed the active tab, switch to the previous tab
    if (parseInt(activeTab) >= newProducts.length) {
      setActiveTab((newProducts.length - 1).toString());
    }
  };

  // File handling functions removed as we're not uploading images anymore

  // Handle form change for a specific product
  const handleChange = (
    index: number,
    field: keyof ProductForm,
    value: string | number | boolean | string[]
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

        // Set the selected category ID to trigger the API call for last STT
        setSelectedRootCategoryId(value);
        setSelectedCategoryId(selectedCategory.rootId);
      }
    }
    
    // If STT is manually changed, mark this product to prevent auto-update
    if (field === "stt") {
      setNewProductIndexes(prev => {
        const updated = new Set(prev);
        updated.add(index);
        return updated;
      });
    }

    setProducts(newProducts);

    // Nếu thay đổi STT hoặc categoryId, thử tải lại ảnh preview
    if ((field === "stt" || field === "categoryId") && sharedFolderId) {
      // Sử dụng debounce để tránh gọi quá nhiều lần
      const product = newProducts[index];
      if (
        product &&
        product.stt &&
        product.categoryName &&
        !loadingImages[index] &&
        !failedImages[index] // Không tải lại nếu đã từng gặp lỗi
      ) {
        // Nếu field là categoryId, reset failedImages cho index này để thử lại
        if (field === "categoryId") {
          setFailedImages((prev) => ({ ...prev, [index]: false }));
        }

        // Đợi một chút để state được cập nhật và sử dụng requestAnimationFrame
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (!loadingImages[index]) {
              loadPreviewImage(index);
            }
          });
        }, 500);

        // Không cần cleanup vì hàm này không phải là useEffect
      }
    }
  };

  // Hàm xử lý checkbox cho materials, style, render, form, color
  // Chỉ cho phép chọn 1 giá trị duy nhất
  const handleCheckboxChange = (
    index: number,
    field: "materials" | "style" | "render" | "form" | "color",
    itemId: string,
    checked: boolean
  ): void => {
    const newProducts = [...products];

    // Nếu đang bỏ chọn một giá trị đã chọn, không làm gì cả
    if (!checked && newProducts[index][field]?.includes(itemId)) {
      return;
    }

    // Nếu đang chọn một giá trị mới
    if (checked) {
      // Thay thế giá trị cũ bằng giá trị mới (chỉ cho phép 1 giá trị)
      newProducts[index] = { ...newProducts[index], [field]: [itemId] };
    }

    setProducts(newProducts);
  };

  // Helper function to find category by ID
  const findCategoryById = (categoryId: string) => {
    if (!categoriesData) return null;

    const apiData = categoriesData as unknown as ApiResponse<CategoryGroup[]>;
    if (!apiData?.data) return null;

    for (const group of apiData.data) {
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

    // Validate shared folder ID and folder name
    if (!sharedFolderId.trim()) {
      toast.error("Vui lòng nhập ID Folder Google Drive");
      return;
    }

    // Validate required fields
    const invalidProducts = products.filter(
      (product) => !product.categoryId || !product.stt || product.stt < 1
    );

    if (invalidProducts.length > 0) {
      toast.error(
        `${invalidProducts.length} sản phẩm có thông tin không hợp lệ`
      );
      return;
    }

    // Apply shared folder ID and folder name to all products, and generate product names
    const productsWithFolderId = products.map((product, index) => {
      // Sử dụng URL ảnh từ previewImages nếu có
      const imageUrl = previewImages[index] || product.images;

      // Chuyển đổi mảng thành giá trị đơn lẻ cho API
      const materials =
        product.materials && product.materials.length > 0
          ? product.materials[0]
          : undefined;
      const style =
        product.style && product.style.length > 0
          ? product.style[0]
          : undefined;
      const render =
        product.render && product.render.length > 0
          ? product.render[0]
          : undefined;
      const form =
        product.form && product.form.length > 0 ? product.form[0] : undefined;
      const colorValue =
        product.color && product.color.length > 0
          ? product.color[0]
          : undefined;

      return {
        ...product,
        folderId: sharedFolderId,
        name: `${product.categoryName}`,
        images: imageUrl,
        materials,
        style,
        render,
        form,
        color: colorValue,
      };
    });

    // Send products data directly as JSON
    createProducts(
      { products: productsWithFolderId },
      {
        onSuccess: () => {
          toast.success(`Đã tạo thành công ${products.length} sản phẩm`);

          // Instead of trying to invalidate cache and navigate, use window.location
          // This will cause a full page reload but guarantee fresh data
          // window.location.href = '/dashboard/products';
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  // Loading state
  if (isLoadingCategories || isLoadingLastStt) {
    const text = isLoadingCategories
      ? "Đang tải danh mục..."
      : "Đang tải STT cuối cùng...";
    return <PageLoading text={text} />;
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
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Tải lại ảnh cho tab hiện tại
                if (sharedFolderId) {
                  const currentIndex = parseInt(activeTab);
                  const currentProduct = products[currentIndex];
                  
                  if (currentProduct && currentProduct.categoryName && currentProduct.stt) {
                    // Reset trạng thái lỗi
                    setFailedImages((prev) => ({
                      ...prev,
                      [currentIndex]: false
                    }));
                    
                    // Tải lại ảnh
                    loadPreviewImage(currentIndex);
                    toast.info("Đang tải lại ảnh cho tab hiện tại");
                  } else {
                    toast.error("Không đủ thông tin để tải ảnh");
                  }
                } else {
                  toast.error("Vui lòng nhập ID Folder Google Drive trước");
                }
              }}
              variant="outline"
              size="sm"
              type="button"
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1.5">
                <path d="M3 2v6h6"></path>
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
                <path d="M21 22v-6h-6"></path>
                <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
              </svg>
              Tải lại ảnh
            </Button>
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
        </div>

        <form onSubmit={handleSubmit}>
          {/* Shared Folder ID Section */}
          <Card className="mb-6 py-0 gap-0">
            <CardHeader className="bg-gradient-to-r rounded-t-lg from-orange-50 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="bg-orange-100 text-orange-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="shared-folder-id"
                    className="text-sm font-medium flex items-center"
                  >
                    <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1.1
                    </span>
                    ID Folder Google Drive (dùng chung)
                  </Label>
                  <div className="relative">
                    <Input
                      id="shared-folder-id"
                      value={sharedFolderId}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setSharedFolderId(newValue);
                        
                        // Nếu người dùng đã nhập ID folder và đã chọn danh mục
                        if (newValue && selectedRootCategoryId) {
                          // Đợi một chút để state được cập nhật
                          setTimeout(() => {
                            // Chỉ tải ảnh cho tab hiện tại
                            const currentIndex = parseInt(activeTab);
                            const currentProduct = products[currentIndex];
                            
                            if (currentProduct && currentProduct.categoryName) {
                              // Reset trạng thái lỗi để có thể tải lại ảnh
                              setFailedImages((prev) => ({
                                ...prev,
                                [currentIndex]: false
                              }));
                              
                              // Tải ảnh cho tab hiện tại
                              loadPreviewImage(currentIndex);
                            }
                          }, 500);
                        }
                      }}
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
                    htmlFor="shared-category"
                    className="text-sm font-medium flex items-center"
                  >
                    <span className="bg-orange-100 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1.2
                    </span>
                    Danh mục (dùng chung)
                  </Label>
                  <Select
                    value={selectedRootCategoryId || ""}
                    onValueChange={(value) => {
                      setSelectedRootCategoryId(value);

                      // Tìm category được chọn
                      const apiData = categoriesData as unknown as ApiResponse<
                        CategoryGroup[]
                      >;
                      if (apiData?.data) {
                        let found = false;
                        // let updatedCategoryName = "";
                        // let updatedRootCategoryId = "";

                        // Kiểm tra xem đây là danh mục cha
                        for (const group of apiData.data) {
                          if (group._id === value) {
                            setSelectedCategoryId(group._id);
                            // updatedCategoryName = group.title;
                            // updatedRootCategoryId = group._id;

                            // Cập nhật tất cả sản phẩm với danh mục cha
                            setProducts((prevProducts) => {
                              return prevProducts.map((product) => ({
                                ...product,
                                categoryId: value,
                                categoryName: group.title,
                                categoryPath: group.title,
                                rootCategoryId: group._id,
                              }));
                            });
                            found = true;
                            break;
                          }

                          // Kiểm tra xem đây là danh mục con
                          if (!found) {
                            for (const category of group.items) {
                              if (category._id === value) {
                                setSelectedCategoryId(group._id);
                                // updatedCategoryName = category.name;
                                // updatedRootCategoryId = group._id;

                                // Cập nhật tất cả sản phẩm với danh mục con
                                setProducts((prevProducts) => {
                                  return prevProducts.map((product) => ({
                                    ...product,
                                    categoryId: value,
                                    categoryName: category.name,
                                    categoryPath: `${group.title}`,
                                    rootCategoryId: group._id,
                                  }));
                                });
                                found = true;
                                break;
                              }
                            }
                          }

                          if (found) break;
                        }

                        // Sau khi cập nhật danh mục, chỉ tải ảnh preview cho tab hiện tại
                        if (found && sharedFolderId) {
                          // Đợi một chút để state được cập nhật
                          setTimeout(() => {
                            // Chỉ tải ảnh cho tab hiện tại
                            const currentIndex = parseInt(activeTab);
                            
                            // Reset trạng thái lỗi để có thể tải lại ảnh
                            setFailedImages((prev) => ({
                              ...prev,
                              [currentIndex]: false,
                            }));
                            
                            // Tải ảnh cho tab hiện tại
                            loadPreviewImage(currentIndex);
                          }, 500);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50">
                      <SelectValue placeholder="Chọn danh mục chung" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 w-full">
                      {categoriesData &&
                        (
                          (
                            categoriesData as unknown as ApiResponse<
                              CategoryGroup[]
                            >
                          )?.data || []
                        ).map((group: CategoryGroup) => (
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
                              {group.items.map((category: CategoryItem) => (
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
                  {selectedRootCategoryId && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="text-xs text-orange-600 font-medium">
                        Danh mục đã chọn sẽ áp dụng cho tất cả {products.length}{" "}
                        sản phẩm
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs 
            value={activeTab} 
            onValueChange={(newTabValue) => {
              setActiveTab(newTabValue);
              
              // Khi chuyển tab, kiểm tra xem tab đó đã có ảnh chưa
              const tabIndex = parseInt(newTabValue);
              const product = products[tabIndex];
              
              // Nếu đủ điều kiện và chưa có ảnh, tải ảnh cho tab đó
              if (
                sharedFolderId && 
                product && 
                product.stt && 
                product.categoryName && 
                !previewImages[tabIndex] && 
                !loadingImages[tabIndex]
              ) {
                // Reset trạng thái lỗi khi chuyển tab để có thể tải lại ảnh
                setFailedImages((prev) => ({
                  ...prev,
                  [tabIndex]: false
                }));
                
                // Đợi một chút để state được cập nhật
                setTimeout(() => {
                  loadPreviewImage(tabIndex);
                }, 500);
                
                // Thêm một lần tải ảnh nữa sau thời gian dài hơn để đảm bảo ảnh được tải
                setTimeout(() => {
                  if (!previewImages[tabIndex] && !loadingImages[tabIndex]) {
                    loadPreviewImage(tabIndex);
                  }
                }, 1500);
              }
            }}>
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
                <Card className="py-0 gap-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      Thông tin sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left side - Form fields */}
                      <div className="w-full md:w-1/2 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label
                              htmlFor={`name-${index}`}
                              className="text-sm font-medium flex items-center"
                            >
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.1
                              </span>
                              Tên sản phẩm (tự động)
                            </Label>
                            <Input
                              id={`name-${index}`}
                              value={`${
                                product.categoryName || "[Chọn danh mục]"
                              }`}
                              disabled
                              className="border-gray-300 bg-gray-50 text-gray-500 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Tên sản phẩm được tạo tự động dựa trên danh mục đã
                              chọn
                            </p>
                          </div>

                          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label
                              htmlFor={`platform-${index}`}
                              className="text-sm font-medium flex items-center"
                            >
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.2
                              </span>
                              Platform
                            </Label>
                            <Input
                              id={`platform-${index}`}
                              value={product.platform}
                              onChange={(e) =>
                                handleChange(index, "platform", e.target.value)
                              }
                              placeholder="Nhập platform (ví dụ: 3dsmax, Cinema 4D, Blender...)"
                              className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Platform mặc định là 3dsmax
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label
                              htmlFor={`stt-${index}`}
                              className="text-sm font-medium flex items-center"
                            >
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.3
                              </span>
                              STT
                            </Label>
                            <Input
                              id={`stt-${index}`}
                              type="number"
                              min="1"
                              value={product.stt || 1}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "stt",
                                  Number(e.target.value)
                                )
                              }
                              required
                              className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              placeholder="Nhập STT"
                            />
                          </div>

                          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label
                              htmlFor={`description-${index}`}
                              className="text-sm font-medium flex items-center"
                            >
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.4
                              </span>
                              Mô tả
                            </Label>
                            <textarea
                              id={`description-${index}`}
                              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              value={product.description || ""}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập mô tả chi tiết về sản phẩm..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`price-${index}`}
                              className="text-sm font-medium flex items-center"
                            >
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.5
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
                                2.6
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

                        {/* Phong cách */}
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center">
                              <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.7
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
                                    name={`style-${index}`}
                                    checked={(product.style || []).includes(
                                      style.id
                                    )}
                                    onChange={(e) =>
                                      handleCheckboxChange(
                                        index,
                                        "style",
                                        style.id,
                                        e.target.checked
                                      )
                                    }
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
                                2.8
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
                                    name={`render-${index}`}
                                    checked={(product.render || []).includes(
                                      engine.id
                                    )}
                                    onChange={(e) =>
                                      handleCheckboxChange(
                                        index,
                                        "render",
                                        engine.id,
                                        e.target.checked
                                      )
                                    }
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

                        <div className="space-y-2 bg-purple-50 p-2 rounded-lg border border-purple-100">
                          <Label className="text-sm font-medium flex items-center">
                            <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                              2.9
                            </span>
                            Màu sắc
                          </Label>
                          <div className="flex flex-wrap gap-1 p-2 border rounded-md border-gray-200 bg-white">
                            {colors.map((color) => (
                              <div key={color.hex} className="relative">
                                <label className="cursor-pointer">
                                  <div
                                    className={`w-6 h-6 rounded-full border transition-all ${
                                      (product.color || []).includes(color.hex)
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
                                      name={`color-${index}`}
                                      className="opacity-0 absolute"
                                      checked={(product.color || []).includes(
                                        color.hex
                                      )}
                                      onChange={(e) =>
                                        handleCheckboxChange(
                                          index,
                                          "color",
                                          color.hex,
                                          e.target.checked
                                        )
                                      }
                                    />
                                    {(product.color || []).includes(
                                      color.hex
                                    ) && (
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
                      </div>

                      {/* Right side - Image preview and additional options */}
                      <div className="w-full md:w-1/2 space-y-4">
                        {/* Image preview */}
                        <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium flex items-center">
                              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.10
                              </span>
                              Ảnh preview
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Reset failed state khi người dùng click tải lại
                                if (failedImages[index]) {
                                  setFailedImages((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                }
                                loadPreviewImage(index);
                              }}
                              disabled={
                                loadingImages[index] ||
                                !sharedFolderId ||
                                !product.stt ||
                                !product.categoryName
                              }
                              className="text-xs h-8"
                            >
                              {loadingImages[index]
                                ? "Đang tải..."
                                : "Tải lại ảnh"}
                            </Button>
                          </div>

                          <div className="mt-2 border border-blue-200 rounded-md overflow-hidden bg-white">
                            {loadingImages[index] ? (
                              <div className="flex items-center justify-center h-[300px] bg-gray-50">
                                <div className="text-center">
                                  <svg
                                    className="animate-spin h-8 w-8 text-blue-500 mx-auto"
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
                                  <p className="mt-2 text-sm text-gray-500">
                                    Đang tải ảnh...
                                  </p>
                                </div>
                              </div>
                            ) : previewImages[index] ? (
                              <div className="relative">
                                <Image
                                  src={`${urlBE}/${previewImages[index]}`}
                                  alt={`Preview ${product.name}`}
                                  className="w-full h-[300px] object-contain"
                                  width={400}
                                  height={300}
                                  unoptimized
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                                  {product.stt < 10
                                    ? `0${product.stt}`
                                    : product.stt}
                                  . {product.categoryName}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-[300px] bg-gray-50">
                                <div className="text-center">
                                  <svg
                                    className="h-12 w-12 text-gray-300 mx-auto"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <p className="mt-2 text-sm text-gray-500">
                                    {!sharedFolderId
                                      ? "Nhập ID Folder Google Drive trước"
                                      : !product.categoryName
                                      ? "Chọn danh mục trước"
                                      : !product.stt
                                      ? "Nhập STT trước"
                                      : failedImages[index]
                                      ? "Không tìm thấy ảnh. Nhấn 'Tải lại ảnh' để thử lại."
                                      : "Chưa có ảnh preview"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {previewImages[index] && (
                            <p className="text-xs text-blue-600">
                              Đã tải ảnh preview thành công. URL ảnh sẽ được lưu
                              cùng sản phẩm.
                            </p>
                          )}
                        </div>

                        {/* Chất liệu */}
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center">
                              <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2.11
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
                                    name={`materials-${index}`}
                                    checked={(product.materials || []).includes(
                                      material.id
                                    )}
                                    onChange={(e) =>
                                      handleCheckboxChange(
                                        index,
                                        "materials",
                                        material.id,
                                        e.target.checked
                                      )
                                    }
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
                                2.12
                              </span>
                              Hình dạng
                            </Label>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-200 bg-white">
                              {forms.map((form) => (
                                <div key={form.id} className="text-center">
                                  <label className="flex flex-col items-center space-y-1 cursor-pointer hover:bg-gray-50 p-1 rounded min-w-[50px] w-auto">
                                    <input
                                      type="radio"
                                      name={`form-${index}`}
                                      checked={(product.form || []).includes(
                                        form.id
                                      )}
                                      onChange={(e) =>
                                        handleCheckboxChange(
                                          index,
                                          "form",
                                          form.id,
                                          e.target.checked
                                        )
                                      }
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
                      </div>
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
