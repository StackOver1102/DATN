"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, CircleDollarSign } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  likes?: number;
  views?: number;
  className?: string;
  isPro?: boolean;
  downloads?: number;
  rating?: number;
  format?: string[];
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  likes = 0,
  views = 250,
  className = "",
  isPro = false,
  downloads,
  rating,
  format = [],
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className={`group block h-full ${className}`}>
      <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        <div className="relative aspect-square bg-gray-50 flex-shrink-0">
          <Image
            src={image}
            alt={name || "Product Image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isPro ? (
            <div className="absolute top-2 right-2 bg-black text-yellow-400 px-2 py-1 text-xs font-bold rounded">
              PRO
            </div>
          ) : (
            <div className="absolute top-2 right-2 bg-black text-yellow-400 px-2 py-1 text-xs font-bold rounded">
              FREE
            </div>
          )}
        </div>
        <div className="p-3 flex-grow flex flex-col justify-between">
          <h3
            className="font-medium text-sm mb-2 line-clamp-1 group-hover:text-blue-600 text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap"
            title={name}
          >
            {name}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-bold text-blue-600">{price}</span>
              <CircleDollarSign className="w-3 h-3 text-yellow-500" />
              {/* <span className="text-gray-600 text-xs">Coin</span> */}
            </div>
            <div className="flex items-center gap-1">
              {downloads !== undefined ? (
                <>
                  <span>Downloads: {downloads}</span>
                  {rating && <span className="ml-2">★ {rating}</span>}
                </>
              ) : (
                <>
                  <Heart className="w-3 h-3" />
                  <span>{likes}</span>
                  <Eye className="w-3 h-3 ml-2" />
                  <span>{views}</span>
                </>
              )}
            </div>
          </div>
          {format && format.length > 0 && (
            <div className="flex gap-1 mt-2">
              {format.slice(0, 3).map((fmt, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs rounded"
                >
                  {fmt.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
