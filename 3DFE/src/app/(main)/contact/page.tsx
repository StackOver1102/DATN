import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getContactContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_SSR}/master-data/type/contact-us`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contact us content: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].content || "";
    }

    return "";
  } catch (error) {
    console.error("Error fetching contact us content:", error);
    return "";
  }
}

// Server component
const ContactUsPage = async () => {
  const content = await getContactContent();

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Liên hệ</h1>

        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Nội dung Liên hệ chưa có sẵn vào lúc này.</p>
        )}
      </div>
    </Container>
  );
};

export default ContactUsPage;
