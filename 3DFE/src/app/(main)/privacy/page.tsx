import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getPrivacyContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_SSR || 'http://localhost:3333'}/master-data/type/privacy-policy`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch privacy policy: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].content || "";
    }

    return "";
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    return "";
  }
}

// Server component
const PrivacyPolicyPage = async () => {
  const content = await getPrivacyContent();

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Privacy Policy content is not available at this time.</p>
        )}
      </div>
    </Container>
  );
};

export default PrivacyPolicyPage;
