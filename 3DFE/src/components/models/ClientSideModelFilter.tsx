"use client";

import { useState, useRef } from "react";
import { CategorySection } from "@/lib/types";
import ModelFilter from "@/components/ModelFilter";

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  formats: string[];
  polygons: string;
  renderEngine: string[];
  colors: string[];
  forms: string[];
  styles: string[];
  materials: string[];
  free: boolean;
  hasTextures: boolean;
  hasAnimation: boolean;
}

interface ApiFilterParams {
  search?: string;
  subSearch?: string;
  categoryName?: string;
  categoryPath?: string;
  style?: string;
  materials?: string;
  render?: string;
  form?: string;
  color?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export default function ClientSideModelFilter({
  initialCategories,
  initialCategoryParam,
  initialItemParam,
  initialFormatsParam,
  initialRenderParam,
  initialColorsParam,
  initialFormsParam,
  initialPolygonsParam,
  initialFreeParam,
  initialHasTexturesParam,
  initialHasAnimationParam,
  onFilterChange,
}: {
  initialCategories: CategorySection[];
  initialCategoryParam?: string;
  initialItemParam?: string;
  initialFormatsParam?: string;
  initialRenderParam?: string;
  initialColorsParam?: string;
  initialFormsParam?: string;
  initialPolygonsParam?: string;
  initialFreeParam?: boolean;
  initialHasTexturesParam?: boolean;
  initialHasAnimationParam?: boolean;
  onFilterChange?: (filters: FilterState, apiParams: ApiFilterParams) => void;
}) {
  // Sử dụng ref để theo dõi lần filter đầu tiên
  const isFirstFilter = useRef(true);

  // Parse các tham số từ URL và props
  const parseURLParams = () => {
    // Đọc các tham số từ URL hiện tại - safely check for window
    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams("");

    // Khởi tạo state từ URL params hoặc prop values
    const formatsFromURL = initialFormatsParam
      ? initialFormatsParam.split(",")
      : searchParams.get("formats")?.split(",") || [];

    const renderFromURL = initialRenderParam
      ? initialRenderParam.split(",")
      : searchParams.get("render")?.split(",") || [];

    const colorsFromURL = initialColorsParam
      ? initialColorsParam.split(",")
      : searchParams.get("colors")?.split(",") || [];

    const formsFromURL = initialFormsParam
      ? initialFormsParam.split(",")
      : searchParams.get("forms")?.split(",") || [];

    const polygonsFromURL =
      initialPolygonsParam || searchParams.get("polygons") || "any";

    const freeFromURL =
      initialFreeParam !== undefined
        ? initialFreeParam
        : searchParams.get("free") === "true";

    const hasTexturesFromURL =
      initialHasTexturesParam !== undefined
        ? initialHasTexturesParam
        : searchParams.get("hasTextures") === "true";

    const hasAnimationFromURL =
      initialHasAnimationParam !== undefined
        ? initialHasAnimationParam
        : searchParams.get("hasAnimation") === "true";

    const stylesFromURL = searchParams.get("style")?.split(",") || [];
    const materialsFromURL = searchParams.get("materials")?.split(",") || [];

    return {
      categories: initialCategoryParam ? [initialCategoryParam] : [],
      priceRange: [0, 100] as [number, number], // Đảm bảo kiểu dữ liệu là tuple [number, number]
      formats: formatsFromURL,
      polygons: polygonsFromURL,
      renderEngine: renderFromURL,
      colors: colorsFromURL,
      forms: formsFromURL,
      styles: stylesFromURL,
      materials: materialsFromURL,
      free: freeFromURL,
      hasTextures: hasTexturesFromURL,
      hasAnimation: hasAnimationFromURL,
    };
  };

  // Khởi tạo state với các giá trị từ URL
  const [filters, setFilters] = useState<FilterState>(parseURLParams());

  // Convert filter state to API parameters
  const convertFiltersToApiParams = (filters: FilterState): ApiFilterParams => {
    const params: ApiFilterParams = {};

    // Process categories
    if (filters.categories.length > 0) {
      // Check if it's a category-subcategory pair
      const categoryItem = filters.categories[0];
      if (categoryItem.includes("-")) {
        const parts = categoryItem.split("-");
        const category = parts[0];
        const subcategory = parts.slice(1).join("-");
        params.categoryName = category;
        params.subSearch = subcategory;
      } else {
        params.categoryName = categoryItem;
      }
    }

    // Process styles
    if (filters.styles?.length > 0) {
      params.style = filters.styles.join(",");
    }

    // Process materials
    if (filters.materials?.length > 0) {
      params.materials = filters.materials.join(",");
    }

    // Process render engines
    if (filters.renderEngine.length > 0) {
      params.render = filters.renderEngine.join(",");
    }

    // Process forms
    if (filters.forms.length > 0) {
      params.form = filters.forms.join(",");
    }

    // Process colors
    if (filters.colors.length > 0) {
      // For colors, we need to use the hex values without the # symbol
      const formattedColors = filters.colors.map((color) =>
        color.replace("#", "")
      );
      params.color = formattedColors.join(",");
    }

    // Process formats if needed
    if (filters.formats.length > 0) {
      params.search = filters.formats.join(",");
    }

    // Process other boolean filters
    if (filters.free) {
      params.search = params.search ? `${params.search},free` : "free";
    }

    if (filters.hasTextures) {
      params.search = params.search ? `${params.search},textures` : "textures";
    }

    if (filters.hasAnimation) {
      params.search = params.search
        ? `${params.search},animation`
        : "animation";
    }

    return params;
  };

  // Handle filter changes
  const handleFilterChange = (filterParams: FilterState) => {
    // Ensure only one category can be selected
    if (filterParams.categories.length > 1) {
      // Keep only the latest selected category
      filterParams.categories = [
        filterParams.categories[filterParams.categories.length - 1],
      ];
    }

    // So sánh để đảm bảo chỉ cập nhật khi có thay đổi thực sự
    if (JSON.stringify(filters) === JSON.stringify(filterParams)) {
      return;
    }

    // Convert to API parameters
    const apiParams = convertFiltersToApiParams(filterParams);

    // Update local state
    setFilters(filterParams);

    // Call the parent component's onFilterChange if provided
    if (onFilterChange) {
      // Use setTimeout to ensure this runs after the current execution context
      // This prevents React batching from causing duplicate API calls
      setTimeout(() => {
        onFilterChange(filterParams, apiParams);
      }, 0);
    }

    // Bỏ qua việc cập nhật URL trong lần đầu tiên nếu đã có tham số từ URL
    if (isFirstFilter.current && initialCategoryParam) {
      isFirstFilter.current = false;
      return;
    }

    // Update URL with filters - safely check for window
    if (typeof window === "undefined") {
      return; // Skip URL updates during server-side rendering
    }

    const searchParams = new URLSearchParams(window.location.search);
    console.log("searchParams", searchParams)
    
    // Remove page parameter completely when filters change instead of setting it to 1
    searchParams.delete("page");

    // Xử lý categories
    if (filterParams.categories.length > 0) {
      searchParams.set("category", filterParams.categories[0]);
    } else {
      searchParams.delete("category");
    }

    // Xử lý formats
    if (filterParams.formats.length > 0) {
      searchParams.set("formats", filterParams.formats.join(","));
    } else {
      searchParams.delete("formats");
    }

    // Xử lý renderEngine
    if (filterParams.renderEngine.length > 0) {
      searchParams.set("render", filterParams.renderEngine.join(","));
    } else {
      searchParams.delete("render");
    }

    // Xử lý colors
    if (filterParams.colors.length > 0) {
      searchParams.set("colors", filterParams.colors.join(","));
    } else {
      searchParams.delete("colors");
    }

    // Xử lý forms
    if (filterParams.forms.length > 0) {
      searchParams.set("forms", filterParams.forms.join(","));
    } else {
      searchParams.delete("forms");
    }

    // Xử lý styles
    if (filterParams.styles.length > 0) {
      searchParams.set("style", filterParams.styles.join(","));
    } else {
      searchParams.delete("style");
    }

    // Xử lý materials
    if (filterParams.materials.length > 0) {
      searchParams.set("materials", filterParams.materials.join(","));
    } else {
      searchParams.delete("materials");
    }

    // Xử lý các boolean options
    if (filterParams.free) {
      searchParams.set("free", "true");
    } else {
      searchParams.delete("free");
    }

    if (filterParams.hasTextures) {
      searchParams.set("hasTextures", "true");
    } else {
      searchParams.delete("hasTextures");
    }

    if (filterParams.hasAnimation) {
      searchParams.set("hasAnimation", "true");
    } else {
      searchParams.delete("hasAnimation");
    }

    // Xử lý polygons
    if (filterParams.polygons && filterParams.polygons !== "any") {
      searchParams.set("polygons", filterParams.polygons);
    } else {
      searchParams.delete("polygons");
    }

    // Update URL without refreshing the page
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    isFirstFilter.current = false;
  };

  return (
    <ModelFilter
      onFilterChange={handleFilterChange}
      categories={initialCategories}
      isLoading={false}
      initialCategoryParam={initialCategoryParam}
      initialItemParam={initialItemParam}
    />
  );
}
