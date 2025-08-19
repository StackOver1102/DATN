import React from 'react';
import { Container } from '@/components/ui/container';

// Function to fetch content on the server
async function getContactContent() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/master-data/type/contact-us`, {
      cache: 'no-store' // Don't cache this request
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
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>Contact Us content is not available at this time.</p>
        )}
      </div>
    </Container>
  );
};

export default ContactUsPage;
