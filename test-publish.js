// Simple test script to verify the publish-to-wordpress API endpoint
const fetch = require('node-fetch');
require('dotenv').config();

// Test data
const testData = {
  content: {
    title: 'Test Post from API',
    description: 'This is a test post created from the API',
    keywords: 'test, api, integration',
    cleanedHtml: '<p>This is a test post content with <strong>HTML formatting</strong>.</p>',
    originalUrl: 'https://example.com/test-post'
  }
};

// Get the API URL from environment variable or use default
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testPublish() {
  console.log('Testing publish-to-wordpress endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/api/publish-to-wordpress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Error:', result.error || 'Unknown error');
      if (result.details) {
        console.error('Details:', result.details);
      }
      process.exit(1);
    }
    
    console.log('✅ Test passed! Post successfully published to WordPress');
    console.log(`Post ID: ${result.data?.post_id}`);
    console.log(`Edit URL: ${result.data?.edit_link}`);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testPublish();
