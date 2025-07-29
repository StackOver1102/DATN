"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategorySection } from "@/lib/types";
import { Loading } from "@/components/ui/loading";
import React from "react";

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

const initialFilterState: FilterState = {
  categories: [],
  priceRange: [0, 100],
  formats: [],
  polygons: "",
  renderEngine: [],
  colors: [],
  forms: [],
  free: false,
  hasTextures: false,
  hasAnimation: false,
};

interface ModelFilterProps {
  onFilterChange: (filters: FilterState) => void;
  categories?: CategorySection[];
  isLoading?: boolean;
  initialCategoryParam?: string;
  initialItemParam?: string;
}

export default function ModelFilter({
  onFilterChange,
  categories = [],
  isLoading = false,
  initialCategoryParam,
  initialItemParam,
}: ModelFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Set initial expanded sections based on URL parameters
  const [expandedSections, setExpandedSections] = useState({
    categories: Boolean(initialCategoryParam), // Auto-expand categories if a category param exists
    price: true,
    formats: true,
    properties: true,
    form: true,
    color: true,
  });

  // Initialize expanded categories based on URL parameters
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>(() => {
    // Create an object to track expanded states
    const expanded: { [key: string]: boolean } = {};

    if (initialCategoryParam) {
      // If we have a category parameter, expand that category
      expanded[initialCategoryParam] = true;
    }

    return expanded;
  });

  // Default categories to use if none are provided
  const defaultCategories = [
    {
      id: "architecture",
      name: "Architecture",
      count: 8234,
      subcategories: [
        "Buildings",
        "Houses",
        "Commercial",
        "Residential",
        "Industrial",
      ],
    },
    {
      id: "bathroom",
      name: "Bathroom",
      count: 2876,
      subcategories: ["Bathtubs", "Sinks", "Toilets", "Showers", "Accessories"],
    },
    {
      id: "childroom",
      name: "Childroom",
      count: 1892,
      subcategories: ["Toys", "Beds", "Desks", "Storage", "Decor"],
    },
    {
      id: "decoration",
      name: "Decoration",
      count: 6543,
      subcategories: [
        "Paintings",
        "Sculptures",
        "Vases",
        "Mirrors",
        "Accessories",
      ],
    },
    {
      id: "furniture",
      name: "Furniture",
      count: 12847,
      subcategories: [
        "Chairs",
        "Tables",
        "Sofas",
        "Beds",
        "Storage",
        "Sideboards",
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      count: 3456,
      subcategories: [
        "Cabinets",
        "Appliances",
        "Islands",
        "Sinks",
        "Accessories",
      ],
    },
    {
      id: "lighting",
      name: "Lighting",
      count: 4321,
      subcategories: [
        "Chandeliers",
        "Table Lamps",
        "Floor Lamps",
        "Wall Lights",
        "Pendant Lights",
      ],
    },
    {
      id: "materials",
      name: "Materials",
      count: 1654,
      subcategories: ["Wood", "Metal", "Fabric", "Stone", "Glass"],
    },
    {
      id: "other",
      name: "Other Models",
      count: 1234,
      subcategories: ["Vehicles", "Electronics", "Sports", "Tools", "Misc"],
    },
    {
      id: "plants",
      name: "Plants",
      count: 2134,
      subcategories: [
        "Bouquet",
        "Indoor",
        "Fitowall",
        "Tree",
        "Bush",
        "Grass",
        "Outdoor",
      ],
    },
    {
      id: "scripts",
      name: "Scripts",
      count: 234,
      subcategories: [
        "Animation",
        "Modeling",
        "Rendering",
        "Utilities",
        "Effects",
      ],
    },
    {
      id: "technology",
      name: "Technology",
      count: 1987,
      subcategories: ["Computers", "Phones", "Gadgets", "Audio", "Gaming"],
    },
    {
      id: "textures",
      name: "Textures",
      count: 6789,
      subcategories: ["Wood", "Fabric", "Metal", "Stone", "Concrete", "Tile"],
    },
  ];

  // Transform API categories to the format expected by the component
  const transformedCategories =
    categories.length > 0
      ? categories.map((category) => ({
          id: category.title.toLowerCase().replace(/\s+/g, "-"),
          name: category.title,
          count: category.items?.length || 0,
          subcategories: category.items?.map((item) => item.name) || [],
        }))
      : defaultCategories;

  // Ref để kiểm tra xem đã khởi tạo filter chưa
  const isInitialized = React.useRef(false);

  // Lấy các tham số bộ lọc ban đầu từ URL
  useEffect(() => {
    // Nếu đã khởi tạo rồi thì không chạy lại
    if (isInitialized.current) {
      return;
    }

    // Khởi tạo các tham số bộ lọc
    const updatedFilters = { ...filters };
    let shouldUpdateFilters = false;

    console.log("ModelFilter initializing with:", {
      initialCategoryParam,
      initialItemParam,
      transformedCategories,
    });

    // Xử lý category và item
    if (initialCategoryParam) {
      // Tìm category trong danh sách
      const categoryParts = initialCategoryParam.split("-");
      const categoryId = categoryParts[0]; // Lấy phần đầu tiên làm categoryId

      const foundCategory = transformedCategories.find(
        (cat) => cat.id.toLowerCase() === categoryId.toLowerCase()
      );

      console.log("Found category:", foundCategory);

      if (foundCategory) {
        // Mở rộng category này
        setExpandedCategories((prev) => ({
          ...prev,
          [foundCategory.id]: true,
        }));

        if (initialItemParam) {
          // Tìm item trong category
          const itemToFind = decodeURIComponent(initialItemParam).trim();
          console.log("Looking for item:", itemToFind);

          const foundItemIndex = foundCategory.subcategories.findIndex(
            (subcat) => subcat.toLowerCase() === itemToFind.toLowerCase()
          );

          console.log("Found item index:", foundItemIndex);

          if (foundItemIndex >= 0) {
            // Tạo ID cho category-item và cập nhật filters
            const subcatName = foundCategory.subcategories[foundItemIndex];
            const itemId = subcatName.toLowerCase().replace(/\s+/g, "-");
            const categoryItemId = `${foundCategory.id}-${itemId}`;

            console.log("Setting filter with categoryItemId:", categoryItemId);

            // Cập nhật categories trong filters
            updatedFilters.categories = [categoryItemId];
            shouldUpdateFilters = true;
          } else {
            // Nếu không tìm thấy item cụ thể, chỉ chọn category
            updatedFilters.categories = [foundCategory.id];
            shouldUpdateFilters = true;
          }
        } else {
          // Nếu không có item, chỉ chọn category
          updatedFilters.categories = [foundCategory.id];
          shouldUpdateFilters = true;
        }
      }
    }

    // Nếu cần cập nhật filters
    if (shouldUpdateFilters) {
      setFilters(updatedFilters);
    }

    // Đánh dấu là đã khởi tạo
    isInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const fileFormats = [
  //   { id: "3ds", name: "3ds Max", count: 8947 },
  //   { id: "obj", name: "OBJ", count: 7234 },
  //   { id: "fbx", name: "FBX", count: 6123 },
  //   { id: "blend", name: "Blender", count: 4567 },
  //   { id: "c4d", name: "Cinema 4D", count: 3456 },
  //   { id: "ma", name: "Maya", count: 2876 },
  //   { id: "skp", name: "SketchUp", count: 2345 },
  //   { id: "dwg", name: "AutoCAD", count: 1987 },
  // ];

  const renderEngines = [
    { id: "vray", name: "Vray", count: 5432, icon: "✓" },
    { id: "corona", name: "Corona", count: 4321, icon: "🔴" },
    { id: "standard", name: "Standard", count: 3210, icon: "" },
  ];

  const colors = [
    "#ffffff",
    "#6b7280",
    "#000000",
    "#8b4513",
    "#dc2626",
    "#f97316",
    "#eab308",
    "#f3e8d0",
    "#fbb6ce",
    "#d946ef",
    "#8b5cf6",
    "#3b82f6",
    "#06b6d4",
    "#10b981",
    "#84cc16",
    "#65a30d",
  ];

  const forms = [
    { id: "circle", name: "Circle", shape: "○" },
    { id: "oval", name: "Oval", shape: "⬭" },
    { id: "square", name: "Square", shape: "□" },
    { id: "rectangle", name: "Rectangle", shape: "▭" },
    { id: "triangle", name: "Triangle", shape: "△" },
    { id: "diamond", name: "Diamond", shape: "◇" },
    { id: "pentagon", name: "Pentagon", shape: "⬟" },
    { id: "star", name: "Star", shape: "☆" },
    { id: "l-shape", name: "L-Shape", shape: "L" },
    { id: "cross", name: "Cross", shape: "✚" },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];

    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFormatChange = (formatId: string) => {
    const newFormats = filters.formats.includes(formatId)
      ? filters.formats.filter((id) => id !== formatId)
      : [...filters.formats, formatId];

    const newFilters = { ...filters, formats: newFormats };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRenderEngineChange = (engineId: string) => {
    const newEngines = filters.renderEngine.includes(engineId)
      ? filters.renderEngine.filter((id) => id !== engineId)
      : [...filters.renderEngine, engineId];

    const newFilters = { ...filters, renderEngine: newEngines };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleColorChange = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];

    const newFilters = { ...filters, colors: newColors };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFormChange = (formId: string) => {
    const newForms = filters.forms.includes(formId)
      ? filters.forms.filter((f) => f !== formId)
      : [...filters.forms, formId];

    const newFilters = { ...filters, forms: newForms };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters(initialFilterState);
    onFilterChange(initialFilterState);
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.formats.length > 0 ||
    filters.renderEngine.length > 0 ||
    filters.colors.length > 0 ||
    filters.forms.length > 0 ||
    filters.free ||
    filters.hasTextures ||
    filters.hasAnimation;

  // Tạo một hàm trợ giúp để kiểm tra liệu một subcategory có được chọn không
  const isSubcategoryChecked = (categoryId: string, subcategory: string) => {
    const itemId = `${categoryId}-${subcategory
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    return filters.categories.includes(itemId);
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      {/* Filter Header */}
      <div className="p-3 lg:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            Filters
          </h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 h-6 lg:h-8 px-1 lg:px-2"
            >
              <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Clear all</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>

        {/* Search */}
        {/* <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <input
            type="text"
            placeholder="Search models..."
            className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
          />
        </div> */}
      </div>

      {/* Categories */}
      <div className="border-b border-gray-200">
        <Button
          variant="ghost"
          onClick={() => toggleSection("categories")}
          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 h-auto justify-between text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Categories
          </span>
          {expandedSections.categories ? (
            <ChevronUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          )}
        </Button>

        {expandedSections.categories && (
          <div className="px-3 lg:px-4 pb-3 lg:pb-4 space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loading variant="spinner" size="md" />
              </div>
            ) : (
              transformedCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  {/* Main Category */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center gap-2 text-left w-full p-1 hover:bg-gray-50 rounded"
                    >
                      {expandedCategories[category.id] ? (
                        <ChevronUp className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-800">
                        {category.name}
                      </span>
                    </button>
                    <span className="text-xs text-gray-500 mr-1">
                      ({category.count})
                    </span>
                  </div>

                  {/* Subcategories */}
                  {expandedCategories[category.id] && (
                    <div className="ml-5 lg:ml-6 space-y-1">
                      {category.subcategories &&
                        category.subcategories.map((subcategory, index) => (
                          <label
                            key={`${category.id}-${index}`}
                            className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isSubcategoryChecked(
                                category.id,
                                subcategory
                              )}
                              onChange={() =>
                                handleCategoryChange(
                                  `${category.id}-${subcategory
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`
                                )
                              }
                              className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-xs lg:text-sm text-gray-700">
                              {subcategory}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      {/* <div className="border-b border-gray-200">
        <Button
          variant="ghost"
          onClick={() => toggleSection("price")}
          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 h-auto justify-between text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Price Range
          </span>
          {expandedSections.price ? (
            <ChevronUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          )}
        </Button>

        {expandedSections.price && (
          <div className="px-3 lg:px-4 pb-3 lg:pb-4 space-y-2 lg:space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange(Number(e.target.value), 0)}
                className="w-full px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 rounded text-xs lg:text-sm"
                placeholder="Min"
              />
              <span className="text-gray-500 text-xs lg:text-sm">-</span>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
                className="w-full px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 rounded text-xs lg:text-sm"
                placeholder="Max"
              />
            </div>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.free}
                onChange={(e) => {
                  const newFilters = { ...filters, free: e.target.checked };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-xs lg:text-sm text-gray-700">
                Free models only
              </span>
            </label>
          </div>
        )}
      </div> */}

      {/* File Formats */}
      {/* <div className="border-b border-gray-200">
        <Button
          variant="ghost"
          onClick={() => toggleSection("formats")}
          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 h-auto justify-between text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            File Formats
          </span>
          {expandedSections.formats ? (
            <ChevronUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" />
          )}
        </Button>

        {expandedSections.formats && (
          <div className="px-3 lg:px-4 pb-3 lg:pb-4 space-y-1.5 lg:space-y-2">
            {fileFormats.map((format) => (
              <label
                key={format.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.formats.includes(format.id)}
                    onChange={() => handleFormatChange(format.id)}
                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs lg:text-sm text-gray-700">
                    {format.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">({format.count})</span>
              </label>
            ))}
          </div>
        )}
      </div> */}

      {/* Render */}
      <div className="border-b border-gray-200">
        <div className="px-3 lg:px-4 py-2.5 lg:py-3">
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Render
          </span>
        </div>
        <div className="px-3 lg:px-4 pb-3 lg:pb-4">
          <div className="flex flex-wrap gap-1.5 lg:gap-2">
            {renderEngines.map((engine) => (
              <Button
                key={engine.id}
                variant={
                  filters.renderEngine.includes(engine.id)
                    ? "secondary"
                    : "outline"
                }
                size="sm"
                onClick={() => handleRenderEngineChange(engine.id)}
                className={`h-auto px-2 py-1 lg:px-2.5 lg:py-1.5 ${
                  filters.renderEngine.includes(engine.id)
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {engine.icon && <span className="mr-1.5">{engine.icon}</span>}
                <span className="text-xs lg:text-sm font-medium">
                  {engine.name}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Format */}
      <div className="border-b border-gray-200">
        <div className="px-3 lg:px-4 py-2.5 lg:py-3">
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Format
          </span>
        </div>
        <div className="px-3 lg:px-4 pb-3 lg:pb-4">
          <div className="flex flex-wrap gap-1.5 lg:gap-2">
            <Button
              variant={
                filters.formats.includes("obj") ? "secondary" : "outline"
              }
              size="sm"
              onClick={() => handleFormatChange("obj")}
              className={`h-auto px-2 py-1 lg:px-2.5 lg:py-1.5 ${
                filters.formats.includes("obj")
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xs lg:text-sm font-medium">.obj</span>
            </Button>
            <Button
              variant={
                filters.formats.includes("fbx") ? "secondary" : "outline"
              }
              size="sm"
              onClick={() => handleFormatChange("fbx")}
              className={`h-auto px-2 py-1 lg:px-2.5 lg:py-1.5 ${
                filters.formats.includes("fbx")
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xs lg:text-sm font-medium">.fbx</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="border-b border-gray-200">
        <div className="px-3 lg:px-4 py-2.5 lg:py-3">
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Form
          </span>
        </div>
        <div className="px-3 lg:px-4 pb-3 lg:pb-4">
          <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => handleFormChange(form.id)}
                className={`w-8 h-8 lg:w-10 lg:h-10 border-2 rounded flex items-center justify-center text-sm lg:text-lg transition-colors ${
                  filters.forms.includes(form.id)
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                title={form.name}
              >
                {form.shape}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="border-b border-gray-200">
        <div className="px-3 lg:px-4 py-2.5 lg:py-3">
          <span className="font-medium text-gray-900 text-sm lg:text-base">
            Color
          </span>
        </div>
        <div className="px-3 lg:px-4 pb-3 lg:pb-4">
          <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
            {colors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${
                  filters.colors.includes(color)
                    ? "border-gray-800 scale-110"
                    : "border-gray-300 hover:border-gray-400"
                } ${color === "#ffffff" ? "border-gray-400" : ""}`}
                style={{ backgroundColor: color }}
                title={color}
              >
                {filters.colors.includes(color) && (
                  <span
                    className={`text-xs ${
                      color === "#ffffff" ||
                      color === "#f3e8d0" ||
                      color === "#fbb6ce"
                        ? "text-black"
                        : "text-white"
                    }`}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
