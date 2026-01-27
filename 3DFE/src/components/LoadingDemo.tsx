"use client";

import { useState } from "react";
import { Loading } from "./ui/loading";
import { LoadingButton } from "./ui/loading-button";
import { LoadingOverlay } from "./ui/loading-overlay";
import { Button } from "./ui/button";

export default function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const simulateOverlayLoading = () => {
    setIsOverlayLoading(true);
    setTimeout(() => setIsOverlayLoading(false), 3000);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Các thành phần Loading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Spinner</h3>
            <Loading variant="spinner" text="Đang tải..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Dots</h3>
            <Loading variant="dots" text="Đang tải..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Progress</h3>
            <Loading variant="progress" text="Đang tải..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Skeleton</h3>
            <Loading variant="skeleton" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Nút Loading</h2>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            isLoading={isLoading}
            loadingText="Đang tải..."
            onClick={simulateLoading}
          >
            Nút mặc định
          </LoadingButton>

          <LoadingButton
            variant="secondary"
            isLoading={isLoading}
            loadingText="Đang lưu..."
            onClick={simulateLoading}
          >
            Nút phụ
          </LoadingButton>

          <LoadingButton
            variant="destructive"
            isLoading={isLoading}
            onClick={simulateLoading}
          >
            Nút hủy
          </LoadingButton>

          <LoadingButton
            variant="outline"
            isLoading={isLoading}
            loadingText="Đang xử lý..."
            onClick={simulateLoading}
          >
            Nút viền
          </LoadingButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Lớp phủ Loading</h2>
        <LoadingOverlay
          isLoading={isOverlayLoading}
          loadingText="Đang tải nội dung..."
        >
          <div className="border p-6 rounded-lg">
            <h3 className="font-medium mb-4">Nội dung với lớp phủ</h3>
            <p className="mb-4">
              Nội dung này sẽ bị che phủ bởi lớp phủ loading khi nhấn nút.
            </p>
            <Button onClick={simulateOverlayLoading}>
              Hiện lớp phủ Loading
            </Button>
          </div>
        </LoadingOverlay>
      </div>
    </div>
  );
}
