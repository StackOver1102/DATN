"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import { Loading } from "@/components/ui/loading";
import { ApiResponse } from "@/interface/pagination";

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

interface CreateModalData {
  title: string;
  content: string;
  isActive?: boolean;
}
interface Modal {
  _id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export default function CreateModalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateModalData>({
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

  const { mutate: createModal, isPending: isCreating } = useApiMutation<
    ApiResponse<Modal>,
    CreateModalData
  >("initmodal", "/initmodal", "post");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    createModal(formData, {
      onSuccess: () => {
        router.push("/dashboard/modal");
      },
      onError: (error) => {
        console.error("Error creating modal:", error.message);
        alert("Có lỗi xảy ra khi tạo modal!");
      },
    });
  };

  const handleInputChange = (
    field: keyof CreateModalData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
        <h1 className="text-2xl font-bold">Tạo Modal Mới</h1>
      </div>

      <Card className="max-w">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
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
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2"
              >
                {isCreating && <Loading size="sm" variant="spinner" />}
                {isCreating ? "Đang tạo..." : "Tạo Modal"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
