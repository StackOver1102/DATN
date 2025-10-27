import ClientSideModelsPage from "@/components/models/ClientSideModelsPage";

// interface Model {
//   id: string;
//   title: string;
//   price: number;
//   image: string;
//   format: string[];
//   category: string;
//   isPro: boolean;
//   polygons: number;
//   hasTextures: boolean;
//   downloads: number;
//   rating: number;
// }

// Interface for raw category data from API
interface RawCategoryData {
  title?: string;
  items?: Array<{
    name: string;
    subcategories?: string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// Interface for Product data from API
interface Product {
  _id: string;
  title?: string;
  price: number;
  images?: string;
  format?: string[];
  category?: string;
  isPro?: boolean;
  polygons?: number;
  hasTextures?: boolean;
  downloads?: number;
  rating?: number;
  [key: string]: unknown;
}

async function getProducts(
  page = 1,
  limit = 60,
  category?: string,
  item?: string,
  q?: string
) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) {
      queryParams.append("categoryPath", category);
    }

    if (item) {
      queryParams.append("categoryName", item);
    }

    if (q) {
      queryParams.append("q", q);
    }

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL_SSR
      }/products?${queryParams.toString()}&sortBy=stt`,
      {
        next: { revalidate: 60 }, // Revalidate every 60 seconds
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      data: {
        items: [],
        meta: { currentPage: 1, totalPages: 1, totalItems: 0 },
      },
    };
  }
}

async function getCategories() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/grouped`,
      {
        next: { revalidate: 1 }, // Revalidate 1p hour
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await res.json();

    // Process categories data to ensure correct structure
    if (data?.data && Array.isArray(data.data)) {
      return data.data.map((category: RawCategoryData) => ({
        title: category.title || "Uncategorized",
        items: Array.isArray(category.items) ? category.items : [],
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

interface ModelsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    item?: string;
    categoryName?: string;
    subSearch?: string;
    q?: string;
  }>;
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  // Get query parameters from URL
  const categoryParam = (await searchParams).categoryName;

  const itemParam = (await searchParams).subSearch;

  const currentPage = Number((await searchParams).page) || 1;

  // Fetch data in parallel
  const [productsData, categoriesData] = await Promise.all([
    getProducts(currentPage, 30, categoryParam, itemParam),
    getCategories(),
  ]);

  // Process categories data
  const categories = categoriesData || [];

  // Extract products data
  const products = productsData?.data?.items || [];
  const totalItems = productsData?.data?.meta?.totalItems || 0;
  // If there are no products, totalPages could be 0, but we'll handle this in the component
  const totalPages = productsData?.data?.meta?.totalPages ?? 0;

  // console.log('totalItems', totalItems)
  // console.log('totalItems', categories)
  // Map the products to ensure they have the required 'name' property
  const mappedProducts = products.map((product: Product) => ({
    ...product,
    name: product.name || "Unnamed Product", // Ensure name property exists
  }));

  // Pass all data to a client component that will handle the UI and interactions
  return (
    <ClientSideModelsPage
      categories={categories}
      initialModels={mappedProducts}
      totalModels={totalItems}
      currentPage={currentPage}
      totalPages={totalPages}
      categoryParam={categoryParam}
      itemParam={itemParam}
    />
  );
}
