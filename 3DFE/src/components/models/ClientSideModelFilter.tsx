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
  free: boolean;
  hasTextures: boolean;
  hasAnimation: boolean;
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
}) {
  console.log("ClientSideModelFilter initialized with:", {
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
  });

  // Sử dụng ref để theo dõi lần filter đầu tiên
  const isFirstFilter = useRef(true);

  // Parse các tham số từ URL và props
  const parseURLParams = () => {
    // Đọc các tham số từ URL hiện tại
    const searchParams = new URLSearchParams(window.location.search);

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

    return {
      categories: initialCategoryParam ? [initialCategoryParam] : [],
      priceRange: [0, 100] as [number, number], // Đảm bảo kiểu dữ liệu là tuple [number, number]
      formats: formatsFromURL,
      polygons: polygonsFromURL,
      renderEngine: renderFromURL,
      colors: colorsFromURL,
      forms: formsFromURL,
      free: freeFromURL,
      hasTextures: hasTexturesFromURL,
      hasAnimation: hasAnimationFromURL,
    };
  };

  // Khởi tạo state với các giá trị từ URL
  const [filters, setFilters] = useState<FilterState>(parseURLParams());

  // Handle filter changes
  const handleFilterChange = (filterParams: FilterState) => {
    // So sánh để đảm bảo chỉ cập nhật khi có thay đổi thực sự
    if (JSON.stringify(filters) === JSON.stringify(filterParams)) {
      return;
    }

    setFilters(filterParams);

    // Bỏ qua việc cập nhật URL trong lần đầu tiên nếu đã có tham số từ URL
    if (isFirstFilter.current && initialCategoryParam) {
      isFirstFilter.current = false;
      return;
    }

    // Update URL with filters
    const searchParams = new URLSearchParams(window.location.search);

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
