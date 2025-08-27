"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
// import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { toast } from "sonner";

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

interface RichTextEditorProps {
  contentType: string;
  title: string;
  contentId: string;
}

// Rich text editor component
const RichTextEditor = ({
  contentType,
  title,
  contentId,
}: RichTextEditorProps) => {
  const [content, setContent] = useState("");
  const [, setIsLoading] = useState(true); // Start with loading state
  const [isSaving, setIsSaving] = useState(false);

  // Fetch content - either by ID or by type
  const endpoint = contentId
    ? `/master-data/${contentId}`
    : `/master-data/type/${contentType}`;


  const { data, isLoading: isLoadingContent } = useApiQuery<{
    data: {
      _id: string;
      type: string;
      code: string;
      name: string;
      content: string;
    };
  }>(`masterdata-${contentType}-${contentId || "new"}`, endpoint, {
    refetchOnMount: true,
    staleTime: 0,
  });

  // Use useEffect to handle the data changes
  useEffect(() => {

    if (!data) return;

    try {
      if (contentId && data?.data) {
        // Single item response when fetching by ID
        setContent(data.data.content || "");
      } else if (
        data?.data &&
        Array.isArray(data.data) &&
        data.data.length > 0
      ) {
        // Array response when fetching by type
        setContent(data.data[0].content || "");
      }
    } catch (error) {
      console.error("Error processing content data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [data, contentId, contentType]);

  // Save content mutation - use PUT for updates, POST for new content
  const { mutate: saveContent } = useApiMutation(
    `masterdata-${contentType}-${contentId || "new"}`,
    contentId ? `/master-data/${contentId}` : `/master-data`,
    contentId ? "patch" : "post"
  );

  const handleSave = () => {
    setIsSaving(true);

    // Prepare the data for saving
    const saveData =
      contentId && data?.data
        ? {
            // If editing existing content, use its ID and preserve other fields
            _id: contentId,
            type: data.data.type || contentType,
            code: data.data.code || contentType,
            name: data.data.name || title,
            content: content,
            // isActive:
            //   data.data.isActive !== undefined ? data.data.isActive : true,
          }
        : {
            // If creating new content
            type: contentType,
            code: contentType,
            name: title,
            content: content,
            isActive: true,
          };

    saveContent(saveData, {
      onSuccess: () => {
        toast.success(`${title} content saved successfully`);
        setIsSaving(false);

        // Redirect back to main page after successful save
        setTimeout(() => {
          window.location.href = "/dashboard/master-data";
        }, 1500);
      },
      onError: (error: Error) => {
        toast.error(`Error saving ${title} content: ${error.message}`);
        setIsSaving(false);
      },
    });
  };

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

  return (
    <div className="space-y-4">
      {isLoadingContent ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="min-h-[400px] border rounded-md">
            <Editor
              apiKey="qagffr3pkuv17a8on1afax661irst1hbr4e6tbv888sz91jc"
              value={content}
              onEditorChange={(newContent: string) => setContent(newContent)}
              init={{
                ...editorConfig,
                promotion: false,
                branding: false,
              }}
            />
          </div>
          <div className="flex justify-end mt-2 space-x-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/master-data")}
              className="w-24"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="w-24">
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const contentTypes = [
  {
    value: "terms-of-use",
    label: "Terms of Use",
    description: "Manage the Terms of Use content for the website",
  },
  {
    value: "privacy-policy",
    label: "Privacy Policy",
    description: "Manage the Privacy Policy content for the website",
  },
  {
    value: "contact-us",
    label: "Contact Us",
    description: "Manage contact information and details",
  },
  {
    value: "about-us",
    label: "About Us",
    description: "Manage about us information and company details",
  },
  {
    value: "faq",
    label: "FAQ",
    description: "Manage frequently asked questions and answers",
  },
];

export default function ContentEditPage() {
  // Use a different approach to avoid hydration mismatch
  const [contentType, setContentType] = useState("terms-of-use");
  const [contentId, setContentId] = useState("");

  // Set initial values after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setContentType(params.get("tab") || "terms-of-use");
      setContentId(params.get("id") || "");
    }
  }, []);

  // Find the content type details
  const selectedContent =
    contentTypes.find((type) => type.value === contentType) || contentTypes[0];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Content</h1>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/dashboard/master-data")}
        >
          Back to List
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b">
          {contentTypes.map((type) => (
            <div
              key={type.value}
              className={`px-4 py-2 cursor-pointer ${
                type.value === contentType
                  ? "border-b-2 border-primary font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => {
                if (contentId) {
                  window.location.href = `/dashboard/master-data/edit?tab=${type.value}&id=${contentId}`;
                } else {
                  window.location.href = `/dashboard/master-data/edit?tab=${type.value}`;
                }
              }}
            >
              {type.label}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedContent.label}</CardTitle>
          <CardDescription>{selectedContent.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            contentType={selectedContent.value}
            title={selectedContent.label}
            contentId={contentId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
