"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { IconThumbUp, IconUpload, IconTrash } from "@tabler/icons-react";
import Image from "next/image";

// Import RefundStatus enum from shared location
enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

interface RefundApprovalFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
}

export default function RefundApprovalForm({
  onSubmit,
  onCancel,
  isProcessing,
}: RefundApprovalFormProps) {
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("status", RefundStatus.APPROVED);
    
    if (adminNotes.trim()) {
      formData.append("adminNotes", adminNotes.trim());
    }
    
    // Append files if any
    selectedFiles.forEach(file => {
      formData.append("attachments", file);
    });
    
    await onSubmit(formData);
  };

  const handleCancel = () => {
    // Clean up preview URLs to avoid memory leaks
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    setSelectedFiles([]);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">
          Ghi chú (không bắt buộc)
        </h4>
        <Textarea
          placeholder="Nhập ghi chú cho việc chấp nhận yêu cầu hoàn tiền..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
        />
      </div>
      
      {/* File Upload Section */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          Hình ảnh đính kèm (không bắt buộc)
        </h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const newFiles = Array.from(e.target.files);
                  setSelectedFiles((prev) => [...prev, ...newFiles]);
                  
                  // Generate preview URLs
                  const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                  setPreviewImages((prev) => [...prev, ...newPreviews]);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <IconUpload className="h-4 w-4" />
              Chọn ảnh
            </Button>
            <span className="text-sm text-gray-500">
              {selectedFiles.length > 0 ? `${selectedFiles.length} file đã chọn` : "Chưa có file nào được chọn"}
            </span>
          </div>
          
          {/* Image Preview */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="h-24 w-full relative border rounded-md overflow-hidden">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      // Remove the file and its preview
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                      
                      // Revoke the object URL to avoid memory leaks
                      URL.revokeObjectURL(preview);
                      setPreviewImages(previews => previews.filter((_, i) => i !== index));
                    }}
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loading size="sm" variant="spinner" />
              Đang xử lý...
            </>
          ) : (
            <>
              <IconThumbUp className="h-4 w-4" />
              Chấp nhận yêu cầu
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
