"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Grid, List } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { CategorySection } from "@/lib/types";
import Image from "next/image";
import ClientSideModelFilter from "./ClientSideModelFilter";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";

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
  quantityCommand: number;
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

// Interface for API filter parameters
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
  isPro?: string;
  price?: string;
}

export default function ClientSideModelsPage({
  categories,
  initialModels,
  totalModels,
  // currentPage,
  totalPages,
  categoryParam,
  itemParam,
}: ClientSideModelsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [models, setModels] = useState(initialModels);
  const [count, setCount] = useState(totalModels);
  const [loading, setLoading] = useState(false);
  const [currentApiParams, setCurrentApiParams] =
    useState<ApiFilterParams | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pro" | "free">("all");
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);

  // Function to fetch models based on filter parameters
  const fetchModels = useCallback(async (apiParams: ApiFilterParams) => {
    // Force fetch data regardless of parameter changes

    try {
      setLoading(true);

      // Build query string from API parameters
      const queryParams = new URLSearchParams();
      console.log("queryParams", queryParams);

      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      // Add page and limit if not present
      if (!apiParams.page) {
        queryParams.append("page", "1");
      }

      if (!apiParams.limit) {
        queryParams.append("limit", "60");
      }

      // Make API request
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL
        }/products?${queryParams.toString()}&sortBy=stt`
      );
      const data = await response.json();

      // Check for the correct response format
      if (data && data.data) {
        // Handle the NestJS standard response format
        const items = data.data.items || [];
        setModels(items);
        setCount(data.data.meta?.totalItems || 0);
        setCurrentTotalPages(data.data.meta?.totalPages || 1);

        setCurrentApiParams(apiParams);
      } else if (data && data.results) {
        // Handle the old response format for backward compatibility
        setModels(data.results || []);
        setCount(data.total || data.results?.length || 0);
        // Calculate total pages for old response format
        const itemsPerPage = apiParams.limit || 60;
        const totalItems = data.total || data.results?.length || 0;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
        setCurrentTotalPages(calculatedTotalPages);
        setCurrentApiParams(apiParams);
      } else {
        // If no valid data format is found, set empty models
        setModels([]);
        setCount(0);
        setCurrentTotalPages(1);
        setCurrentApiParams(apiParams);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = (
    _filters: unknown,
    apiParams: ApiFilterParams
  ) => {
    if (apiParams) {
      fetchModels(apiParams);

      // Scroll to top of page when filters change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle tab change for All/Pro/Free filtering
  const handleTabChange = (tab: "all" | "pro" | "free") => {
    setActiveTab(tab);

    // Create new URLSearchParams from current URL
    const params = new URLSearchParams(window.location.search);

    // Reset to first page when changing tabs
    params.delete("page");

    // Apply filter based on selected tab
    if (tab === "pro") {
      params.set("isPro", "true");
    } else if (tab === "free") {
      params.set("isPro", "false");
    } else {
      // For 'all' tab, remove isPro filter
      params.delete("isPro");
    }

    // Update URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });

    // Create API params from the new URL params
    const apiParams: ApiFilterParams = {};
    params.forEach((value, key) => {
      (apiParams as Record<string, string>)[key] = value;
    });
    apiParams.page = 1;
    apiParams.limit = 30;

    fetchModels(apiParams);

    // Scroll to top of page when changing tabs
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Initialize filters state
  // We're tracking the state but not directly using it in the render
  // Just keeping it in sync with URL parameters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Effect to sync activeTab with URL parameters
  useEffect(() => {
    const isPro = searchParams.get("isPro");

    if (isPro === "true") {
      setActiveTab("pro");
    } else if (isPro === "false") {
      setActiveTab("free");
    } else {
      setActiveTab("all");
    }
  }, [searchParams]);

  // Effect to handle image search results from sessionStorage
  useEffect(() => {
    const searchType = searchParams.get('searchType');

    if (searchType === 'image' && typeof window !== 'undefined') {
      console.log('🔍 Image search mode detected');

      // First, try to load from existing allImageSearchResults (for pagination)
      const allStoredResults = sessionStorage.getItem('allImageSearchResults');

      if (allStoredResults) {
        // Page change in image search mode - repaginate from stored results
        try {
          const allResults = JSON.parse(allStoredResults);
          const currentPage = parseInt(searchParams.get('page') || '1', 10);
          const itemsPerPage = 60;

          // Calculate pagination
          const totalPages = Math.ceil(allResults.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedResults = allResults.slice(startIndex, endIndex);

          console.log('📄 Re-paginating image search results:', {
            totalResults: allResults.length,
            currentPage,
            totalPages,
            showingResults: paginatedResults.length,
            range: `${startIndex + 1}-${Math.min(endIndex, allResults.length)}`
          });

          setModels(paginatedResults);
          setCount(allResults.length);
          setCurrentTotalPages(totalPages);
          setLoading(false);

          return; // Skip the initial load logic below
        } catch (error) {
          console.error('❌ Error re-paginating image search results:', error);
        }
      }

      // Initial load from imageSearchResults (first time after search)
      try {
        const savedResults = sessionStorage.getItem('imageSearchResults');
        console.log('📦 Raw sessionStorage data:', savedResults);

        if (savedResults) {
          const data = JSON.parse(savedResults);
          console.log('📊 Parsed data object:', data);
          console.log('📈 Data structure check:', {
            hasSuccess: 'success' in data,
            successValue: data.success,
            hasResults: 'results' in data,
            resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
            resultsLength: data.results?.length,
            hasTotal: 'total' in data,
            totalValue: data.total
          });

          // Check for results in different possible formats
          let allResults = [];
          let total = 0;

          if (data.success && Array.isArray(data.results)) {
            // Format: {success: true, results: [...], total: X}
            allResults = data.results;
            total = data.total || allResults.length;
            console.log('✅ Found results in format 1 (success + results)');
          } else if (Array.isArray(data.results)) {
            // Format: {results: [...], total: X}
            allResults = data.results;
            total = data.total || allResults.length;
            console.log('✅ Found results in format 2 (results only)');
          } else if (Array.isArray(data)) {
            // Format: [...]
            allResults = data;
            total = data.length;
            console.log('✅ Found results in format 3 (array)');
          }

          if (allResults.length > 0) {
            console.log('🎯 Total image search results:', allResults.length, 'items');
            console.log('📝 First result sample:', allResults[0]);

            // Store all results in sessionStorage for pagination
            sessionStorage.setItem('allImageSearchResults', JSON.stringify(allResults));

            // Get current page from URL (default to 1)
            const currentPage = parseInt(searchParams.get('page') || '1', 10);
            const itemsPerPage = 30;

            // Calculate pagination
            const totalPages = Math.ceil(allResults.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedResults = allResults.slice(startIndex, endIndex);

            console.log('📄 Pagination info:', {
              totalResults: allResults.length,
              currentPage,
              totalPages,
              itemsPerPage,
              showingResults: paginatedResults.length,
              range: `${startIndex + 1}-${Math.min(endIndex, allResults.length)}`
            });

            // Set state with paginated results
            setModels(paginatedResults);
            setCount(total);
            setCurrentTotalPages(totalPages);
            setLoading(false);

            // Clear the initial search results after storing all results
            sessionStorage.removeItem('imageSearchResults');

            console.log('✅ Successfully loaded paginated image search results:', paginatedResults.length, 'of', allResults.length);
          } else {
            console.warn('⚠️ No results found in parsed data');
            setModels([]);
            setCount(0);
            setCurrentTotalPages(1);
            setLoading(false);
          }
        } else {
          console.warn('⚠️ No imageSearchResults found in sessionStorage');
          setModels([]);
          setCount(0);
          setCurrentTotalPages(1);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading image search results:', error);
        setModels([]);
        setCount(0);
        setCurrentTotalPages(1);
        setLoading(false);
      }
    }
  }, [searchParams]);

  // Effect to initialize and sync with URL parameters
  useEffect(() => {
    // Skip this effect if we're in image search mode
    // Image search results are handled by the image search useEffect above
    const searchType = searchParams.get('searchType');
    if (searchType === 'image') {
      console.log('⏭️ Skipping regular fetch - image search mode active');
      return;
    }

    // Extract filter parameters from URL
    const params: ApiFilterParams = {};

    // Get all search parameters
    searchParams.forEach((value, key) => {
      // Include all parameters including pagination
      (params as Record<string, string>)[key] = value;
    });

    // Ensure pagination parameters are set
    if (!params.page) {
      params.page = 1;
    } else {
      // Convert string to number if it's from searchParams
      params.page = parseInt(params.page.toString(), 10);
    }

    params.limit = params.limit ? parseInt(params.limit.toString(), 10) : 30;

    // On initial mount, just set currentApiParams without fetching
    // since we already have initialModels from server
    if (currentApiParams === null) {
      setCurrentApiParams(params);
      return;
    }

    // Check if params have actually changed
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(currentApiParams);

    if (paramsChanged) {
      // Fetch models when URL parameters change
      fetchModels(params);

      // Scroll to top when page changes
      if (
        typeof window !== "undefined" &&
        params.page !== currentApiParams?.page
      ) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [searchParams, fetchModels, currentApiParams]);

  return (
    <div className="min-h-screen bg-gray-50 container mx-auto max-w-7xl">
      <div className="flex">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="w-60 flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <ClientSideModelFilter
                initialCategories={categories}
                initialCategoryParam={categoryParam}
                initialItemParam={itemParam}
                onFilterChange={handleFilterChange}
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

                {/* Show current search query or image search indicator */}
                {
                  searchParams.get("q") ? (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-sm text-gray-700">
                        Search: <span className="font-medium">{searchParams.get("q")}</span>
                      </span>
                      <button
                        onClick={() => {
                          // Remove search query from URL
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete("q");
                          params.delete("page"); // Reset to first page
                          router.push(`?${params.toString()}`, { scroll: false });
                        }}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title="Clear search"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : searchParams.get("searchType") === "image" ? (
                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-purple-700">
                        <span className="font-medium">Image Search Results</span>
                      </span>
                      <button
                        onClick={() => {
                          console.log('🗑️ Clearing image search results');
                          // Clear sessionStorage to ensure no old data remains
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('imageSearchResults');
                            sessionStorage.removeItem('allImageSearchResults');
                          }
                          // Navigate back to models page and force reload to fetch all products
                          window.location.href = '/models';
                        }}
                        className="text-purple-500 hover:text-purple-700 transition-colors"
                        title="Clear image search"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : null
                }

                {/* Filter tabs for All/Pro/Free */}
                <div className="flex border border-gray-300 rounded-lg ml-4">
                  <button
                    className={`px-4 py-1 text-sm ${activeTab === "all"
                      ? "bg-black text-yellow-400 font-medium"
                      : "bg-white text-gray-700"
                      } rounded-l-lg transition-colors`}
                    onClick={() => handleTabChange("all")}
                  >
                    All
                  </button>
                  <button
                    className={`px-4 py-1 text-sm ${activeTab === "pro"
                      ? "bg-black text-yellow-400 font-medium"
                      : "bg-white text-gray-700"
                      } border-l border-r border-gray-300 transition-colors`}
                    onClick={() => handleTabChange("pro")}
                  >
                    Pro
                  </button>
                  <button
                    className={`px-4 py-1 text-sm ${activeTab === "free"
                      ? "bg-black text-yellow-400 font-medium"
                      : "bg-white text-gray-700"
                      } rounded-r-lg transition-colors`}
                    onClick={() => handleTabChange("free")}
                  >
                    Free
                  </button>
                </div>
              </div >

              {
                models.length > 0 && (
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
                )
              }
            </div >
          </div >

          {/* Models Grid/List */}
          < div className="p-6" >
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loading variant="spinner" size="lg" />
                </div>
              }
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loading variant="spinner" size="lg" />
                </div>
              ) : models.length > 0 ? (
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
                          quantityCommand={model.quantityCommand}
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
                    No products found
                  </div>
                  <p className="text-gray-400">
                    Please try searching with different filters
                  </p>
                </div>
              )}
            </Suspense>

            {/* Pagination - only show if we have pages to display */}
            {
              currentTotalPages > 0 && models.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={parseInt(searchParams.get("page") || "1", 10)}
                    totalPages={
                      currentTotalPages || 1
                    } /* Ensure minimum of 1 page */
                    onPageChange={(page) => {
                      // Create a new URLSearchParams object from the current search params
                      const params = new URLSearchParams(searchParams.toString());
                      // Update or add the page parameter
                      params.set("page", page.toString());

                      // Check if we're in image search mode
                      const searchType = searchParams.get('searchType');

                      if (searchType === 'image') {
                        // Image search mode - just update URL, useEffect will handle repagination
                        console.log('🔄 Image search pagination - updating URL only');
                        router.push(`?${params.toString()}`, { scroll: false });

                        // Scroll to top of page
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        // Regular mode - fetch data from API
                        const apiParams: ApiFilterParams = {};
                        params.forEach((value, key) => {
                          (apiParams as Record<string, string>)[key] = value;
                        });

                        // Convert page to number
                        apiParams.page = parseInt(
                          apiParams.page?.toString() || "1",
                          10
                        );

                        // Fetch data directly
                        fetchModels(apiParams);

                        // Scroll to top of page
                        window.scrollTo({ top: 0, behavior: "smooth" });

                        // Also update the URL (this won't cause a full page reload)
                        router.push(`?${params.toString()}`, { scroll: false });
                      }
                    }}
                  />
                </div>
              )
            }
          </div >
        </div >
      </div >
    </div >
  );
}
