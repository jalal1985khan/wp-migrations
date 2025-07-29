import axios from 'axios';

async function testFAQExtraction() {
  try {
    // Test with a URL that likely contains FAQs
    const testUrl = 'https://www.example.com/faq'; // Replace with a real URL that has FAQs
    
    console.log(`Testing FAQ extraction from: ${testUrl}`);
    
    const response = await axios.post('http://localhost:3000/api/extract-content', {
      url: testUrl
    });
    
    console.log('Response status:', response.status);
    
    if (response.data.faq_data) {
      console.log('FAQ Data Found:');
      console.log(`- FAQ Enabled: ${response.data.faq_data.enabled}`);
      console.log(`- Number of FAQ Items: ${response.data.faq_data.items?.length || 0}`);
      
      if (response.data.faq_data.items && response.data.faq_data.items.length > 0) {
        console.log('\nSample FAQ Items:');
        response.data.faq_data.items.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`\n${index + 1}. Question: ${item.question.substring(0, 100)}${item.question.length > 100 ? '...' : ''}`);
          console.log(`   Answer: ${item.answer.substring(0, 100)}${item.answer.length > 100 ? '...' : ''}`);
        });
        
        if (response.data.faq_data.items.length > 3) {
          console.log(`\n... and ${response.data.faq_data.items.length - 3} more items`);
        }
      }
    } else {
      console.log('No FAQ data found in the response');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error: any) {
    console.error('Error testing FAQ extraction:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFAQExtraction();
