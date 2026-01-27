"use client";

import React, { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { useApi } from "@/lib/hooks/useApi";

const PrivacyPolicyPage = () => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const { get } = useApi();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await get("/master-data/type/privacy-policy");
        if (
          response?.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setContent(response.data[0].content || "");
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [get]);

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chính sách bảo mật</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : content ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p>Nội dung Chính sách bảo mật chưa có sẵn vào lúc này.</p>
        )}
      </div>
    </Container>
  );
};

export default PrivacyPolicyPage;
