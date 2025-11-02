"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { Loading, PageLoading } from "@/components/ui/loading";

// Import TinyMCE dynamically to avoid SSR issues
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

interface Modal {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateModalData {
  title: string;
  content: string;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export default function EditModalPage() {
  const router = useRouter();
  const params = useParams();
  const modalId = params.id as string;
  
  const [formData, setFormData] = useState<UpdateModalData>({
    title: "",
    content: "",
    isActive: true,
  });

  // TinyMCE configuration
  const editorConfig = {
    height: 400,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "code",
      "help",
      "wordcount",
    ],
    toolbar:
      "undo redo | formatselect | " +
      "bold italic backcolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "removeformat | help",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
  };

  const { data: modal, isLoading, error } = useApiQuery<Modal>(
    ["initmodal", modalId],
    `/initmodal/${modalId}`
  );

  const { mutate: updateModal, isPending: isUpdating } = useApiMutation<
    ApiResponse<Modal>,
    UpdateModalData
  >("initmodal", `/initmodal/${modalId}`, "patch");

  useEffect(() => {
    if (modal) {
      setFormData({
        title: modal.title,
        content: modal.content,
        isActive: modal.isActive,
      });
    }
  }, [modal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    updateModal(formData, {
      onSuccess: () => {
        router.push("/dashboard/modal");
      },
      onError: (error) => {
        console.error("Error updating modal:", error.message);
        alert("Có lỗi xảy ra khi cập nhật modal!");
      },
    });
  };

  const handleInputChange = (
    field: keyof UpdateModalData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return <PageLoading text="Đang tải thông tin modal..." />;
  }

  if (error || !modal) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Lỗi khi tải dữ liệu
          </div>
          <div className="text-muted-foreground">
            {error?.message || "Không tìm thấy modal"}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/modal")}
            className="mt-4"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <IconArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh sửa Modal</h1>
      </div>

      <Card className="max-w">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconEdit className="h-5 w-5" />
            Thông tin Modal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Nhập tiêu đề modal..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Nội dung <span className="text-red-500">*</span>
              </Label>
              <div className="min-h-[400px] border rounded-md">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  value={formData.content}
                  onEditorChange={(newContent: string) => handleInputChange("content", newContent)}
                  init={{
                    ...editorConfig,
                    promotion: false,
                    branding: false,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Kích hoạt modal</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2"
              >
                {isUpdating && <Loading size="sm" variant="spinner" />}
                {isUpdating ? "Đang cập nhật..." : "Cập nhật Modal"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
