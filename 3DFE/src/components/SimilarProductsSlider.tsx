"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import ProductCard from "./ProductCard";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface SimilarProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface SimilarProductsSliderProps {
  products: SimilarProduct[];
}

export default function SimilarProductsSlider({
  products,
}: SimilarProductsSliderProps) {
  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={24}
        slidesPerView={2}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: 4,
          },
          1024: {
            slidesPerView: 5,
          },
          1280: {
            slidesPerView: 6,
          },
        }}
        className="similar-products-swiper"
      >
        {products.map((item) => (
          <SwiperSlide key={item.id}>
            <ProductCard
              id={item.id}
              name={item.name}
              price={item.price}
              image={item.image}
              likes={0}
              views={250}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
