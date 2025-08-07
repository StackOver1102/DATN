import { Suspense } from "react";
import ModelGrid from "@/components/ModelGrid";
import CategorySidebar from "@/components/CategorySidebar";
import { Loading } from "@/components/ui/loading";
import Pagination from "@/components/Pagination";
import { CategorySection } from "@/lib/types";

async function getProducts(page = 1, limit = 12) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL_SSR}/products?page=${page}&limit=${limit}`,
    {
      next: { revalidate: 5 },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

async function getCategories() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL_SSR}/categories/grouped`,
    {
      next: { revalidate: 3600 }, // Revalidate every hour
    }
  );

  console.log(res);

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

// Interface for raw category data from API
interface RawCategory {
  title?: string;
  items?: Array<{
    name: string;
    subcategories?: string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown; // Allow for other properties
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const currentPage = Number((await searchParams).page) || 1;
  const itemsPerPage = 12;

  // Fetch data in parallel
  const [paginatedProductsData, categoriesData] = await Promise.all([
    getProducts(currentPage, itemsPerPage),
    getCategories(),
  ]);

  const paginatedProducts = paginatedProductsData?.data;

  // Ensure categories data has the correct structure
  let categories: CategorySection[] = [];

  try {
    if (categoriesData?.data && Array.isArray(categoriesData.data)) {
      categories = categoriesData.data.map((category: RawCategory) => {
        // Ensure each category has a title and items array
        return {
          title: category.title || "Uncategorized",
          items: Array.isArray(category.items)
            ? category.items.map((item) => ({
                name: typeof item.name === "string" ? item.name : "Unknown",
                subcategories: Array.isArray(item.subcategories)
                  ? item.subcategories
                  : undefined,
              }))
            : [],
        };
      });
    }
  } catch (error) {
    console.error("Error processing categories data:", error);
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loading variant="spinner" size="lg" />
            </div>
          }
        >
          <>
            <ModelGrid products={paginatedProducts?.items || []} />

            {/* Pagination */}
            {paginatedProducts?.meta && (
              <div className="max-w-7xl mx-auto py-6">
                <Pagination
                  currentPage={paginatedProducts.meta.currentPage}
                  totalPages={paginatedProducts.meta.totalPages}
                  currentPageHref={(page) => `?page=${page}`}
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
        </Suspense>
      </main>
    </div>
  );
}
