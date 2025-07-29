"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid, List } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { CategorySection } from "@/lib/types";
import Image from "next/image";
import ClientSideModelFilter from "./ClientSideModelFilter";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";

interface Model {
  _id: string;
  title: string;
  price: number;
  images: string;
  format: string[];
  category: string;
  isPro: boolean;
  polygons: number;
  hasTextures: boolean;
  downloads: number;
  rating: number;
  name: string;
}

interface ClientSideModelsPageProps {
  categories: CategorySection[];
  initialModels: Model[];
  totalModels: number;
  currentPage: number;
  totalPages: number;
  categoryParam?: string;
  itemParam?: string;
}

export default function ClientSideModelsPage({
  categories,
  initialModels,
  totalModels,
  currentPage,
  totalPages,
  categoryParam,
  itemParam,
}: ClientSideModelsPageProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [models] = useState(initialModels);
  const [count] = useState(totalModels);

  // Initialize filters state
  // We're tracking the state but not directly using it in the render
  // Just keeping it in sync with URL parameters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 container mx-auto max-w-7xl">
      <div className="flex">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <ClientSideModelFilter
                initialCategories={categories}
                initialCategoryParam={categoryParam}
                initialItemParam={itemParam}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={toggleFilters}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>

                <span className="text-sm text-gray-600">
                  {count} models found
                </span>
              </div>

              {models.length > 0 && (
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Models Grid/List */}
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loading variant="spinner" size="lg" />
                </div>
              }
            >
              {models.length > 0 ? (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                      {models.map((model) => (
                        <ProductCard
                          key={model._id}
                          id={model._id}
                          name={model.name}
                          price={model.price}
                          image={model.images || "/placeholder-image.jpg"}
                          isPro={model.isPro}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {models.map((model) => (
                        <div
                          key={model._id}
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex gap-4">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={model.images || "/placeholder-image.jpg"}
                                alt={`${model.title} - 3D model preview`}
                                width={96}
                                height={96}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                                    {model.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <span>
                                      Downloads: {model.downloads || 0}
                                    </span>
                                    <span>★ {model.rating || 0}</span>
                                    <span>
                                      Polygons:{" "}
                                      {model.polygons
                                        ? model.polygons.toLocaleString()
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {Array.isArray(model.format) &&
                                      model.format.map((format, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-gray-100 text-xs rounded"
                                        >
                                          {format.toUpperCase()}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {model.isPro && (
                                    <div className="bg-orange-500 text-white px-2 py-1 text-xs font-bold rounded mb-2">
                                      PRO
                                    </div>
                                  )}
                                  <span className="font-bold text-blue-600 text-lg">
                                    {model.price === 0
                                      ? "Free"
                                      : `$${model.price}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="text-gray-500 text-lg mb-4">
                    Không tìm thấy sản phẩm nào
                  </div>
                  <p className="text-gray-400">
                    Vui lòng thử tìm kiếm với các bộ lọc khác
                  </p>
                </div>
              )}
            </Suspense>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  currentPageHref={(page) =>
                    `?page=${page}${
                      categoryParam ? `&category=${categoryParam}` : ""
                    }${itemParam ? `&item=${itemParam}` : ""}`
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
