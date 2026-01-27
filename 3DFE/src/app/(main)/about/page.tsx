import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getAboutContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_SSR}/master-data/type/about-us`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch about us content: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].content || "";
    }

    return "";
  } catch (error) {
    console.error("Error fetching about us content:", error);
    return "";
  }
}

// Server component
const AboutUsPage = async () => {
  const content = await getAboutContent();

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Về chúng tôi</h1>

        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Nội dung Về chúng tôi chưa có sẵn vào lúc này.</p>
        )}
      </div>
    </Container>
  );
};

export default AboutUsPage;
