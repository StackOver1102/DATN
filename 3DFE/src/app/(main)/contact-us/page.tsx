"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Container } from '@/components/ui/container';

const ContactUsPage = () => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get('/master-data/type/contact-us');
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          setContent(response.data[0].content || "");
        }
      } catch (error) {
        console.error("Error fetching contact us content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Contact Us content is not available at this time.</p>
        )}
      </div>
    </Container>
  );
};

export default ContactUsPage;
