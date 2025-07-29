import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Sample HTML with FAQ section for testing
const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page with FAQ</title>
  <meta name="description" content="Test page with FAQ section">
  <meta name="keywords" content="test, faq, example">
</head>
<body>
  <div class="main-content">
    <h1>Test Page</h1>
    <p>This is some sample content before the FAQ section.</p>
    
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      
      <div class="faq-item">
        <h3>What is this about?</h3>
        <div class="faq-answer">
          <p>This is a test FAQ section to verify extraction works correctly.</p>
        </div>
      </div>
      
      <div class="faq-item">
        <h3>How does it work?</h3>
        <div class="faq-answer">
          <p>The FAQ extraction should identify questions and answers and make them available for editing.</p>
          <p>It should also remove them from the main content.</p>
        </div>
      </div>
    </section>
    
    <p>This is some sample content after the FAQ section.</p>
  </div>
</body>
</html>
`;

// Test the FAQ extraction
async function testFaqExtraction() {
  try {
    console.log('Testing FAQ extraction...');
    
    // Save the sample HTML to a temporary file
    const tempFilePath = path.join(process.cwd(), 'temp-faq-test.html');
    fs.writeFileSync(tempFilePath, sampleHtml);
    
    // Call the extract-content API
    const response = await fetch('http://localhost:3000/api/extract-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: `file://${tempFilePath}`,
        testHtml: sampleHtml // Pass HTML directly for testing
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Extracted content:');
    console.log(JSON.stringify({
      title: data.title,
      description: data.description,
      contentLength: data.content.length,
      faqData: data.faqData,
      hasFaqInContent: data.content.includes('Frequently Asked Questions')
    }, null, 2));
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
    // Verify FAQ data was extracted correctly
    if (!data.faqData || !data.faqData.enabled || data.faqData.items.length === 0) {
      throw new Error('FAQ data was not extracted correctly');
    }
    
    // Verify FAQ section was removed from main content
    if (data.content.includes('Frequently Asked Questions')) {
      console.warn('Warning: FAQ section was not removed from main content');
    }
    
    console.log('✅ FAQ extraction test passed!');
    return data;
  } catch (error) {
    console.error('❌ FAQ extraction test failed:', error);
    throw error;
  }
}

// Test the FAQ publishing
async function testFaqPublishing(extractedData) {
  try {
    console.log('\nTesting FAQ publishing...');
    
    // Modify the FAQ data to test editing
    const modifiedFaqData = {
      ...extractedData.faqData,
      items: [
        ...extractedData.faqData.items,
        {
          question: 'Can I add a new question?',
          answer: 'Yes, you can add new questions to the FAQ section.'
        }
      ]
    };
    
    // Call the publish-to-wordpress API
    const response = await fetch('http://localhost:3000/api/publish-to-wordpress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          ...extractedData,
          faqData: modifiedFaqData,
          slug: 'test-faq-page-' + Date.now()
        },
        config: {
          // Add any required WordPress config here
        }
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Publishing failed: ${JSON.stringify(result)}`);
    }
    
    console.log('Publish result:');
    console.log(JSON.stringify({
      success: result.success,
      postId: result.data?.post_id,
      message: result.message
    }, null, 2));
    
    if (result.success && result.data?.post_id) {
      console.log('✅ FAQ publishing test passed!');
      console.log(`Post created with ID: ${result.data.post_id}`);
    } else {
      throw new Error('Publishing did not return expected success response');
    }
    
    return result;
  } catch (error) {
    console.error('❌ FAQ publishing test failed:', error);
    throw error;
  }
}

// Run the tests
async function runTests() {
  try {
    console.log('Starting FAQ flow tests...\n');
    
    // Test 1: Extract FAQ data
    console.log('=== Test 1: Extract FAQ Data ===');
    const extractedData = await testFaqExtraction();
    
    // Test 2: Publish with modified FAQ data
    console.log('\n=== Test 2: Publish FAQ Data ===');
    await testFaqPublishing(extractedData);
    
    console.log('\n✅ All FAQ flow tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { testFaqExtraction, testFaqPublishing, runTests };
