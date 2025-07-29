"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/interface/product";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ModelGridProps {
  products?: Product[];
}

const ModelGrid: React.FC<ModelGridProps> = ({ products = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Sample data - you can replace with real data
  // const sampleModels = [
  //   {
  //     id: 1,
  //     title: "Fire Bowl Set",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 2,
  //     title: "Gas Grill",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: true,
  //   },
  //   {
  //     id: 3,
  //     title: "Wood Planks",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 4,
  //     title: "Leather Bags Set",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 5,
  //     title: "Egg Grill",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 6,
  //     title: "Kitchen Tools",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 7,
  //     title: "Brick Oven",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: true,
  //   },
  //   {
  //     id: 8,
  //     title: "Kitchen Hood",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 9,
  //     title: "Kitchen Shelves",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 10,
  //     title: "Basket with Logs",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  //   {
  //     id: 11,
  //     title: "Brick Stove",
  //     image:
  //       "https://b5.3dsky.org/media/cache/sky_model_new_thumb_ang/model_images/0000/0000/7831/7831135.6867c3d126bac.jpeg",
  //     isNew: false,
  //     hasVideo: false,
  //   },
  // ];

  // Use provided products or fallback to sample data if empty
  const displayProducts = products.length > 0 ? products : [];

  const categories: Category[] = [
    { id: "all", name: "All", icon: "🏠" },
    { id: "pendant-light", name: "Pendant light", icon: "💡" },
    { id: "sofa", name: "Sofa", icon: "🛋️" },
    { id: "arm-chair", name: "Arm chair", icon: "🪑" },
    { id: "chair", name: "Chair", icon: "🪑" },
    { id: "table", name: "Table", icon: "🪑" },
    { id: "wardrobe", name: "Wardrobe & Display cabinets", icon: "🗄️" },
    { id: "bed", name: "Bed", icon: "🛏️" },
    { id: "table-chair", name: "Table + Chair", icon: "🍽️" },
    { id: "kitchen", name: "Kitchen", icon: "👨‍🍳" },
    { id: "bathroom", name: "Bathroom", icon: "🚿" },
    { id: "decoration", name: "Decoration", icon: "🎨" },
    { id: "lighting", name: "Lighting", icon: "💡" },
    { id: "outdoor", name: "Outdoor", icon: "🌳" },
    { id: "more", name: "...", icon: "➡️" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* New 3D Models Header */}
      <div className="mb-8">
        <div className="bg-black text-white px-6 inline-flex items-center rounded-sm">
          <span className="text-yellow-400 mr-2">🔔</span>
          <span className="font-medium text-yellow-400">New 3D Models</span>
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
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === category.id
                  ? "bg-gray-800 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelGrid;
