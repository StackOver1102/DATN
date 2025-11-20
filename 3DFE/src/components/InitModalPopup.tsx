"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface InitModal {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface InitModalPopupProps {
  showOnce?: boolean; // Chỉ hiển thị một lần dựa trên localStorage
  position?: "center" | "top" | "bottom";
}

export default function InitModalPopup({
  showOnce = true,
  position = "center"
}: InitModalPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalData, setModalData] = useState<InitModal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch init modal data from API
  useEffect(() => {
    const fetchInitModal = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/initmodal/get-initmodal`);
        if (response.ok) {
          const data = await response.json();
          if (data?.data && data.data.isActive) {
            setModalData(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching init modal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitModal();
  }, []);

  useEffect(() => {
    // Don't show if no modal data or still loading
    if (isLoading || !modalData) {
      return;
    }

    // Kiểm tra xem popup đã được hiển thị chưa
    const storageKey = `notification-popup-shown-${modalData._id}`;
    const hasShown = localStorage.getItem(storageKey);

    if (showOnce && hasShown) {
      return;
    }

    // Hiển thị popup sau một chút delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 1000);

    return () => {
      clearTimeout(showTimer);
    };
  }, [modalData, isLoading, showOnce]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (showOnce && modalData) {
        const storageKey = `notification-popup-shown-${modalData._id}`;
        localStorage.setItem(storageKey, "true");
      }
    }, 300); // Thời gian animation
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render if loading, no data, or not visible
  if (isLoading || !modalData || !isVisible) return null;

  const positionClasses = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-20",
    bottom: "items-end justify-center pb-20"
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex ${positionClasses[position]} 
        bg-black/40 transition-opacity duration-300`}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="pr-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {modalData.title}
          </h3>
          <div 
            className="text-gray-600 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: modalData.content }}
          />
        </div>

        {/* Action buttons */}
        {/* <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Đã hiểu
          </button>
        </div> */}
      </div>
    </div>
  );
}
