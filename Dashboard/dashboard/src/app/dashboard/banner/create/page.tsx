"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoading } from "@/components/ui/loading";
import { useApiMutation } from "@/lib/hooks/useApi";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import Image from "next/image";

interface BannerFormData {
  title: string;
  description: string;
  position: "home" | "product_detail" | "about";
  isActive: boolean;
  url: string;
}

interface CreateBannerResponse {
  data: {
    _id: string;
    title: string;
    description?: string;
    imageUrl: string;
    position: string;
    isActive: boolean;
  };
}

export default function CreateBannerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, ] = useState(false);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    description: "",
    position: "home",
    isActive: true,
    url: "",
  });

  // Create banner with image upload mutation
  const { mutate: createBannerWithImage, isPending: isCreatingWithImage } = useApiMutation<
    CreateBannerResponse,
    FormData
  >("banners", "/banners/with-image", "post");



  // Handle form field changes
  const handleChange = (field: keyof BannerFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showErrorToast("Vui lòng chọn file hình ảnh");
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showErrorToast("Kích thước file không được vượt quá 10MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      

    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      showErrorToast("Vui lòng nhập tiêu đề banner");
      return;
    }

    if (!selectedFile) {
      showErrorToast("Vui lòng chọn hình ảnh");
      return;
    }

    try {
      // Create banner with file upload
      const formDataToSend = new FormData();
      formDataToSend.append("file", selectedFile);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("isActive", String(formData.isActive));
      formDataToSend.append("url", formData.url);

      createBannerWithImage(formDataToSend, {
        onSuccess: () => {
          showSuccessToast("Banner đã được tạo thành công");
          router.push("/dashboard/banner");
        },
        onError: (error) => {
          showErrorToast("Lỗi khi tạo banner: " + error.message);
        },
      });
    } catch  {
      showErrorToast("Đã có lỗi xảy ra khi tạo banner");
    }
  };

  // Don't render until mounted (prevents hydration issues)
  if (!mounted) {
    return <PageLoading />;
  }

  const isLoading = isCreatingWithImage || isUploading;

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Thêm banner mới</h1>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Thông tin banner</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info - 2 column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Tiêu đề <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Nhập tiêu đề banner"
                  required
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Vị trí hiển thị</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => handleChange("position", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vị trí hiển thị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Trang chủ</SelectItem>
                    <SelectItem value="product_detail">Chi tiết sản phẩm</SelectItem>
                    <SelectItem value="about">Giới thiệu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Nhập mô tả banner (tùy chọn)"
                rows={3}
              />
            </div>
            
            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Liên kết URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="Nhập URL liên kết khi nhấp vào banner (tùy chọn)"
              />
              <p className="text-sm text-gray-500">
                Ví dụ: https://example.com/promotion
              </p>
            </div>

            {/* Image Upload or URL */}
            <div className="space-y-4">
              <Label>
                Hình ảnh <span className="text-red-500">*</span>
              </Label>
              
              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={100}
                        height={100}
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveFile}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Xóa hình ảnh
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <Label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4" />
                          Chọn hình ảnh
                        </Label>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Hoặc kéo thả hình ảnh vào đây
                      </p>
                    </div>
                  )}
                </div>


              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => handleChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Kích hoạt banner</Label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo banner"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
