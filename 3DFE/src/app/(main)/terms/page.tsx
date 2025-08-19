import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getTermsContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/master-data/type/terms-of-use`, {
      cache: 'no-store' // Don't cache this request
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch terms: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].content || "";
    }
    
    return "";
  } catch (error) {
    console.error("Error fetching terms of use:", error);
    return "";
  }
}

// Server component
const TermsOfUsePage = async () => {
  const content = await getTermsContent();

  return (
    <Container className="py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
        
        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Terms of Use content is not available at this time.</p>
        )}
      </div>
    </Container>
  );
};

export default TermsOfUsePage;
