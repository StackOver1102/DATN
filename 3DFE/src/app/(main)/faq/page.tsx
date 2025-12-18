import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getFAQContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_SSR}/master-data/type/faq`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch FAQ content: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].content || "";
    }

    return "";
  } catch (error) {
    console.error("Error fetching FAQ content:", error);
    return "";
  }
}

// Server component
const FAQPage = async () => {
  const content = await getFAQContent();

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>FAQ content is not available at this time.</p>
        )}
      </div>
    </Container>
  );
};

export default FAQPage;