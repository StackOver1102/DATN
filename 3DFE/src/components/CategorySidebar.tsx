"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CategorySection } from "@/lib/types";

interface CategorySidebarProps {
  categories?: CategorySection[];
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories = [],
}) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All Models");

  // Sử dụng categories từ props nếu có, nếu không thì sử dụng dữ liệu mẫu
  const categoriesData =
    categories.length > 0
      ? categories
      : [
          // Default categories data...
          {
            title: "Architecture",
            items: [
              { name: "Barbecue and grill" },
              { name: "Building" },
              { name: "Environment elements" },
              { name: "Facade element" },
              { name: "Fence" },
              { name: "Other" },
              { name: "Paving" },
              { name: "Playground" },
              { name: "Urban environment" },
            ],
          },
          // ... other default categories
        ];

  // Safely sort categories with proper error handling
  const sortedCategories = categoriesData.map((category) => {
    try {
      // Check if items exists and is an array before spreading
      const items = Array.isArray(category.items)
        ? [...category.items].sort((a, b) => a.name.localeCompare(b.name))
        : [];

      return {
        ...category,
        items: items,
      };
    } catch (error) {
      console.error(`Error processing category: ${category.title}`, error);
      return {
        ...category,
        items: [], // Return empty array if there was an error
      };
    }
  });

  const handleCategoryClick = (categoryTitle: string, itemName?: string) => {
    if (itemName) {
      console.log("categoryTitle", categoryTitle)
      console.log("itemName", itemName)
      setSelectedCategory(itemName);
      // Điều hướng đến trang models với query parameters
      // Using replace to convert %20 to + for URL compatibility
      const encodedCategory = encodeURIComponent(categoryTitle.toLocaleLowerCase()).replace(/%20/g, '+');
      const encodedItem = encodeURIComponent(itemName).replace(/%20/g, '+');
      router.push(
        `/models?categoryName=${encodedCategory}&subSearch=${encodedItem}`
      );
    } else {
      setSelectedCategory(categoryTitle);
      // Điều hướng chỉ với category
      const encodedCategory = encodeURIComponent(categoryTitle).replace(/%20/g, '+');
      router.push(`/models?category=${encodedCategory}`);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-black text-white px-4 inline-flex items-center rounded-sm">
          <span className="font-medium text-yellow-400">All Models</span>
        </div>
        <div className="w-full h-px bg-gray-300 "></div>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="columns-2 md:columns-3 lg:columns-6 gap-6 space-y-0">
          {sortedCategories.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="break-inside-avoid mb-6 space-y-2"
            >
              {/* Section Title */}
              <button
                onClick={() => handleCategoryClick(section.title)}
                className={`font-bold text-base text-left w-full hover:text-blue-600 transition-colors ${
                  selectedCategory === section.title
                    ? "text-blue-600"
                    : "text-gray-900"
                }`}
              >
                {section.title}
              </button>

              {/* Section Items */}
              <div className="space-y-1">
                {Array.isArray(section.items) &&
                  section.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() =>
                        handleCategoryClick(section.title, item.name)
                      }
                      className={`block text-sm text-left w-full hover:text-blue-600 transition-colors ${
                        selectedCategory === item.name
                          ? "text-blue-600"
                          : "text-gray-800"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
