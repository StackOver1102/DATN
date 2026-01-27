"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/interface/product";
import { categoryApi } from "@/lib/api";

// interface CategoryItem {
//   _id: string;
//   name: string;
// }

interface CategoryResponse {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  parentId?: string | null;
}

interface ModelGridProps {
  products?: Product[];
}

const ModelGrid: React.FC<ModelGridProps> = ({ products = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryApi.getAll();
        if (response.success && response.data) {
          // Add "All" category at the beginning
          const allCategories = [
            { _id: "all", name: "Tất cả", icon: "🏠", isActive: true, parentId: null }
          ];

          // Ensure response.data is an array before spreading
          if (Array.isArray(response.data)) {
            setCategories([...allCategories, ...response.data]);
          } else {
            setCategories(allCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      // Filter products by category ID
      const filtered = products.filter(product =>
        product.categoryId === selectedCategory ||
        product.rootCategoryId === selectedCategory
      );
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Use filtered products or all products if none are filtered
  const displayProducts = filteredProducts.length > 0 || selectedCategory !== "all"
    ? filteredProducts
    : products;

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* New 3D Models Header */}
      <div className="mb-8">
        <div className="bg-black text-white px-6 inline-flex items-center rounded-sm">
          <span className="text-yellow-400 mr-2">🔔</span>
          <span className="font-medium text-yellow-400">Mô hình 3D mới</span>
        </div>
        <div className="w-full h-px bg-gray-300 "></div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {displayProducts.map((product) => (
          <Link
            key={product._id}
            href={`/product/${product._id}`}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={product.images || "/placeholder-image.jpg"}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                  {/* Overlay content */}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Category Filter with Scroll */}
      <div className="relative">
        {/* Scrollable Categories Container */}
        <div className="flex gap-2 overflow-x-auto py-2">
          {loading ? (
            // Loading skeleton for categories
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            // Render categories when loaded
            categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategorySelect(category._id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${selectedCategory === category._id
                    ? "bg-gray-800 text-white"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                <span>{category.icon || "📁"}</span>
                <span>{category.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelGrid;
