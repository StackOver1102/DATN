"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ModelGrid from "@/components/ModelGrid";
import CategorySidebar from "@/components/CategorySidebar";
import { Product } from "@/interface/product";
import { useFetchPaginatedData } from "@/lib/hooks/useApi";
import { Loading } from "@/components/ui/loading";
import Pagination from "@/components/Pagination";
import { CategorySection } from "@/lib/types";

interface HomeProps {
  categories?: CategorySection[];
}

export default function HomePage({ categories = [] }: HomeProps) {
  const { status } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const {
    data: paginatedProducts,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useFetchPaginatedData<Product>("products", "products", {
    page: currentPage,
    limit: itemsPerPage,
  });

  // Hiển thị loading chỉ trong phần nội dung
  const isLoading = status === "loading" || isLoadingProducts;

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loading variant="spinner" size="lg" />
          </div>
        ) : productsError ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-red-500">
              Có lỗi khi tải sản phẩm. Vui lòng thử lại sau.
            </p>
          </div>
        ) : (
          <>
            <ModelGrid products={paginatedProducts?.items || []} />

            {/* Pagination */}
            {paginatedProducts?.meta && (
              <div className="max-w-7xl mx-auto py-6">
                <Pagination
                  currentPage={paginatedProducts.meta.currentPage}
                  totalPages={paginatedProducts.meta.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Banner Ads */}
            <div className="max-w-7xl mx-auto py-6">
              <div className="w-full h-16 bg-gray-200 border-2 border-solid border-gray-400 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium mb-1">
                    Advertisement Banner
                  </div>
                </div>
              </div>
            </div>
            {/* Category Sidebar */}
            <div className="max-w-7xl mx-auto py-6">
              <CategorySidebar categories={categories} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
