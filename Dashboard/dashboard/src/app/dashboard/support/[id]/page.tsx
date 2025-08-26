"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome, IconHeadset, IconPhoto, IconX } from "@tabler/icons-react";
import { PageLoading, Loading } from "@/components/ui/loading";
import { toast } from "sonner";
import { User } from "../../users/page";
import Image from "next/image";

interface Support {
  _id: string;
  userId: User;
  title: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  images?: string[];
  imagesByAdmin?: string[];
  attachments?: string[];
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  message: string;
  name?: string;
  email?: string; 
  phone?: string;
}

export default function SupportEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);

  // State for form
  const [formData, setFormData] = useState<{
    status: "resolved" | "rejected";
    response: string;
  }>({
    status: "resolved",
    response: "",
  });
  
  // State for file upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch support data
  const {
    data: supportData,
    isLoading,
    error,
  } = useApiQuery<{ data: Support }>(
    ["support", id as string],
    `/support/${id}`
  );

  // Update mutation
  const { mutate: updateSupport, isPending: isUpdating } = useApiMutation<
    { data: Support },
    { status: "resolved" | "rejected"; response: string }
  >("support", `/support/${id}`, "patch");

  // Set form data when support data is loaded
  useEffect(() => {
    if (supportData?.data?.adminResponse) {
      setFormData(prev => ({
        ...prev,
        response: supportData.data.adminResponse || ""
      }));
    }
  }, [supportData]);

  // Handle status change
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as "resolved" | "rejected"
    }));
  };

  // Handle response change
  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      response: e.target.value
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      // Only accept images
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là hình ảnh`);
        return;
      }
      
      newFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          newPreviews.push(reader.result);
          setPreviewImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };
  
  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.response.trim()) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }

    // Create FormData object for multipart/form-data submission
    const submitData = new FormData();
    submitData.append('status', formData.status);
    submitData.append('response', formData.response);
    
    // Add selected files
    selectedFiles.forEach(file => {
      submitData.append('attachments', file);
    });

    updateSupport(
      submitData as any,
      {
        onSuccess: () => {
          toast.success(`Yêu cầu hỗ trợ đã được ${formData.status === "resolved" ? "giải quyết" : "từ chối"}`);
          router.push("/dashboard/support");
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        },
      }
    );
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải thông tin yêu cầu hỗ trợ..." />;
  }

  // Error state
  if (error || !supportData?.data) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy yêu cầu hỗ trợ"}
        </div>
      </div>
    );
  }

  const support = supportData.data;

  // Check if support request is already processed
  if (support.status !== "pending") {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <h2 className="text-xl font-semibold">Yêu cầu hỗ trợ này đã được xử lý</h2>
          <p className="text-gray-500">Trạng thái hiện tại: {support.status === "resolved" ? "Đã giải quyết" : "Đã từ chối"}</p>
          <Button onClick={() => router.push(`/dashboard/support/${id}/view`)}>
            Xem chi tiết
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <IconHome className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/support">Hỗ trợ</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Xử lý yêu cầu</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Xử lý yêu cầu hỗ trợ</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/support")}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Đang lưu..." : "Lưu phản hồi"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Mã yêu cầu</Label>
                  <p className="font-mono text-xs break-all">{support._id}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Người gửi</Label>
                  <p className="font-medium">{support.name || "Không có tên"}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="font-medium">{support.email}</p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Số điện thoại</Label>
                  <p className="font-medium">{support.phone}</p>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Ngày gửi</Label>
                  <p className="font-medium">
                    {new Date(support.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Nội dung yêu cầu</Label>
                  <p className="font-medium whitespace-pre-line">{support.message}</p>
                </div>

                <div className="mb-4">
                  <Label htmlFor="status" className="block mb-2">Trạng thái xử lý</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Giải quyết</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="response" className="block mb-2">
                Phản hồi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="response"
                placeholder="Nhập phản hồi cho yêu cầu này..."
                value={formData.response}
                onChange={handleResponseChange}
                rows={6}
                className="w-full"
                required
              />
            </div>
            
            {/* Image Upload Section */}
            <div>
              <Label htmlFor="images" className="block mb-2">
                Hình ảnh đính kèm (tối đa 5 ảnh)
              </Label>
              
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <IconPhoto className="h-4 w-4" />
                  Chọn ảnh
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} ảnh đã chọn` : 'Chưa có ảnh nào được chọn'}
                </span>
              </div>
              
              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative h-32 rounded-md overflow-hidden border">
                      <Image 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => removeFile(index)}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/support/${id}/view`)}
          >
            Xem chi tiết
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/support")}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <div className="flex items-center">
                <Loading size="sm" variant="spinner" className="mr-2" />
                Đang lưu...
              </div>
            ) : (
              "Lưu phản hồi"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}