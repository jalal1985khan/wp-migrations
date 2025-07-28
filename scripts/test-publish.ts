import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Test data
const testContent = {
  title: 'Test Post from API',
  description: 'This is a test post created from the API',
  keywords: 'test, api, integration',
  cleanedHtml: '<p>This is a test post content with <strong>HTML formatting</strong>.</p>',
  originalUrl: 'https://example.com/test-post'
};

// Get the API URL from environment variable or use default
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testPublishToWordPress() {
  console.log('Testing publish-to-wordpress endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/api/publish-to-wordpress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent
      }),
    });

    const responseData = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error('Error:', responseData.error || 'Unknown error');
      if (responseData.details) {
        console.error('Details:', responseData.details);
      }
      process.exit(1);
    }
    
    console.log('✅ Test passed! Post successfully published to WordPress');
    console.log(`Post ID: ${responseData.data?.post_id}`);
    console.log(`Edit URL: ${responseData.data?.edit_link}`);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testPublishToWordPress();
