"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface NotificationPopupProps {
    title?: string;
    message?: string;
    showOnce?: boolean; // Chỉ hiển thị một lần dựa trên localStorage
    autoClose?: number; // Tự động đóng sau x giây (0 = không tự động đóng)
    position?: "center" | "top" | "bottom";
}

export default function NotificationPopup({
    title = "Thông báo",
    message = "Chào mừng bạn đến với website của chúng tôi!",
    showOnce = true,
    autoClose = 0,
    position = "center"
}: NotificationPopupProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Kiểm tra xem popup đã được hiển thị chưa
        const hasShown = localStorage.getItem("notification-popup-shown");

        if (showOnce && hasShown) {
            return;
        }

        // Hiển thị popup sau một chút delay
        const showTimer = setTimeout(() => {
            setIsVisible(true);
            setIsAnimating(true);
        }, 1000);

        // Tự động đóng nếu có thiết lập autoClose
        let autoCloseTimer: NodeJS.Timeout;
        if (autoClose > 0) {
            autoCloseTimer = setTimeout(() => {
                handleClose();
            }, autoClose * 1000 + 1000); // +1000 để tính cả delay hiển thị
        }

        return () => {
            clearTimeout(showTimer);
            if (autoCloseTimer) clearTimeout(autoCloseTimer);
        };
    }, [showOnce, autoClose]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            if (showOnce) {
                localStorage.setItem("notification-popup-shown", "true");
            }
        }, 300); // Thời gian animation
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isVisible) return null;

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
          relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6
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
                        {title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end mt-6 space-x-3">
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
                </div>
            </div>
        </div>
    );
}
