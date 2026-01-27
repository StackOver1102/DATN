"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Upload, X } from "lucide-react";
import Link from "next/link";
import { supportApi } from "@/lib/api";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/store/hooks";


export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const { profile } = useAppSelector(
    (state) => state.user
  );
  // const {}
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Auto-fill user data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
      }));
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") || file.type === "application/pdf";
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    setIsSubmitting(true);

    try {
      // Submit data to API
      const response = await supportApi.createWithAttachments(
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message || undefined,
          captchaToken: "", // Include captcha token
          ...(profile ? { userId: profile._id } : {})
        },
        uploadedFiles
      );

      if (response.success) {
        // Reset form on success
        setFormData({
          name: "",
          phone: "",
          email: "",
          message: "",
        });
        setUploadedFiles([]);


        toast.success(
          "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể."
        );
      } else {
        toast.error(
          `Lỗi: ${response.message || "Không thể gửi yêu cầu hỗ trợ"}`
        );
      }
    } catch (error) {
      console.error("Support submission error:", error);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Centered Form */}
      <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 py-12 px-6 sm:px-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-medium mb-2">Bạn cần hỗ trợ?</h1>
            <p className="text-base text-gray-700">
              Để lại thông tin bên dưới. Chúng tôi sẽ liên hệ với bạn sớm nhất
              có thể.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Họ tên
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Nhập họ tên của bạn"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Địa chỉ email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm"
              />
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium">
                Nội dung
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Nhập nội dung tin nhắn"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm resize-none"
              />
            </div>

            {/* File Upload Field */}
            <div className="space-y-2">
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium"
              >
                Tệp đính kèm
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:border-[#3A5B22] text-gray-700 cursor-pointer transition-colors flex items-center gap-3 hover:border-gray-400"
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Tải hình ảnh hoặc PDF (Tối đa 5 file, 10MB mỗi file)
                  </span>
                </label>
              </div>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {file.type.startsWith("image/") ? (
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs">IMG</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs">PDF</span>
                          </div>
                        )}
                        <span className="text-gray-700 text-sm truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-gray-500 hover:text-red-600 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>



            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 border border-transparent text-sm font-bold rounded-lg text-yellow-400 bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </>
                )}
              </div>
            </Button>
          </form >

          {/* Back to Home Link */}
          < div className="flex items-center justify-center mt-6" >
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Về trang chủ
            </Link>
          </div >
        </div >
      </div >
    </div >
  );
}
