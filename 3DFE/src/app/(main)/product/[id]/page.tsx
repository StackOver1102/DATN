import Image from "next/image";
import Link from "next/link";
import { Heart, Download, ChevronRight, CircleDollarSign } from "lucide-react";
import SimilarProductsSlider from "@/components/SimilarProductsSlider";

interface ProductDetailProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock product data - in real app, this would come from an API
const getProductData = (id: string) => {
  return {
    id: id,
    name: "Hewlet bedside table",
    category: "Furniture",
    subcategory: "Sideboard & Chest of drawer",
    price: 30,
    currency: "Coin",
    isPro: true,
    views: 8,
    likes: 0,
    shares: 120,
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&crop=center",
    description:
      "Those who work in a V-Ray version lower than 3.1, be careful, in the materials in the BRDF section there is Microfaset GTR (GGX), if your version is older than 3.1, then the BRDF field will be empty. Choose Blinn, Phong or Ward - whichever is preferable for you. For Corona render, it is recommended to install version no lower than 1.5, since the glossiness of the materials is adjusted taking into account PBR.",
    specifications: {
      idProduct: "5781398.65311f68aad43",
      platform: "3dsMax 2015 + obj",
      render: "Vray + Corona",
      size: "2 MB",
      materials: "Wood",
      colors: ["#8B7355"],
    },
    watermark: "3DSBLUE",
    link: "https://cornerdesign.ru/shop/hewlet",
  };
};

// Mock similar products data
const getSimilarProducts = () => {
  return [
    {
      id: "1",
      name: "Tribù Amanu C-table Dia Side Table",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "2",
      name: "Bed BALI",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "3",
      name: "U-shaped sofa Miley",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "4",
      name: "Secolo Tateyama XL Sofa Fabric Sofa",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "5",
      name: "Bumper Sofa System",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "6",
      name: "Table Poliform Kensington",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "7",
      name: "Fat Sofa Modular By Tom Dixon",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "8",
      name: "Corner Sofa Isla by Ditre Italia",
      price: 30,
      image:
        "https://images.unsplash.com/photo-1493663284031-b7e3aab21900?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "9",
      name: "Modern Dining Chair Set",
      price: 25,
      image:
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "10",
      name: "Wooden Coffee Table",
      price: 35,
      image:
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "11",
      name: "Luxury Armchair",
      price: 45,
      image:
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop&crop=center",
    },
    {
      id: "12",
      name: "Designer Bookshelf",
      price: 40,
      image:
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=400&fit=crop&crop=center",
    },
  ];
};

export default async function ProductDetailPage({
  params,
}: ProductDetailProps) {
  const { id } = await params;
  const product = getProductData(id);
  const similarProducts = getSimilarProducts();

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link href="/models" className="hover:text-blue-600">
              3D Models
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link href="/furniture" className="hover:text-blue-600">
              {product.category}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <Link href="/furniture/sideboard" className="hover:text-blue-600">
              {product.subcategory}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
          {/* Left side - 3D Model Image */}
          <div className="lg:col-span-2 space-y-4 h-full">
            {/* Main Product Image */}
            <div className="bg-gray-50 border rounded-lg p-3 relative">
              <div className="relative aspect-square  rounded">
                <Image
                  src={product.image}
                  alt={product.name || "Product Image"}
                  fill
                  className="object-contain p-4"
                />
              </div>
            </div>

            {/* Product Stats */}
            {/* <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{product.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{product.likes} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                <span>{product.shares} share</span>
              </div>
            </div> */}
          </div>

          {/* Right side - Product Info */}
          <div className="space-y-6 h-full">
            {/* Category Badge */}
            <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {product.category}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Price Section */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Price:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {product.price}
                  </span>
                  <CircleDollarSign className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-600">Coin</span>
                  {product.isPro && (
                    <span className="bg-black text-yellow-400 px-2 py-1 rounded text-xs font-bold">
                      PRO
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Royalty Free License
              </div>

              <hr className="my-4" />

              <div className="text-sm text-gray-600">
                Balance: 0 accesses to PRO models
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">ID Product:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {product.specifications.idProduct}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Platform:</span>
                  <span className="text-gray-900 font-medium">
                    {product.specifications.platform}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Render:</span>
                  <span className="text-gray-900 font-medium">
                    {product.specifications.render}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Size:</span>
                  <span className="text-gray-900 font-medium">
                    {product.specifications.size}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Polygons:</span>
                  <span className="text-gray-900 font-medium">-</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Colors:</span>
                  <div className="flex items-center gap-2">
                    {product.specifications.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Style:</span>
                  <span className="text-gray-900 font-medium">-</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Materials:</span>
                  <span className="text-gray-900 font-medium">
                    {product.specifications.materials}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Formfactor:</span>
                  <span className="text-gray-900 font-medium">-</span>
                </div>
              </div>
            </div>

            {/* Buy Button and Favorite */}
            <div className="flex gap-3">
              <button className="flex-1 bg-black text-yellow-400 font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors">
                <Download className="w-5 h-5" />
                Buy Model
              </button>
              <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 p-3 rounded transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className=" pt-6">
          <div className="border rounded-lg">
            <div className="border-b">
              <div className="flex">
                <button className="px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
                  Comments
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            </div>
          </div>
        </div>

        {/* Similar Products Section - Swiper Slider */}
        <div className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">
            Similar 3D Models
          </h2>
          <SimilarProductsSlider products={similarProducts} />
        </div>
      </div>
    </div>
  );
}
