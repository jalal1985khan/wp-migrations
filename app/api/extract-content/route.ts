import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, testHtml } = await request.json();

    if (!url && !testHtml) {
      return NextResponse.json({ error: 'URL or testHtml is required' }, { status: 400 });
    }

    let html: string;
    
    if (testHtml) {
      // Use the provided HTML directly for testing
      html = testHtml;
    } else if (url.startsWith('file://')) {
      // Handle file URLs for local testing
      const filePath = url.replace('file://', '');
      html = await fs.promises.readFile(filePath, 'utf-8');
    } else {
      // Fetch the HTML content from a URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      html = await response.text();
    }
    
    // Extract content using regex patterns (server-side HTML parsing)
    const extractedContent = extractContentFromHtml(html, url || 'test-url');

    return NextResponse.json(extractedContent);
  } catch (error) {
    console.error('Error extracting content:', error);
    return NextResponse.json(
      { error: 'Failed to extract content from the provided URL' },
      { status: 500 }
    );
  }
}

function extractContentFromHtml(html: string, originalUrl: string) {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Extracted Content';

  // Extract meta description
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  // Extract keywords - handle multiple meta tag formats
  let keywords = '';
  const keywordsPatterns = [
    /<meta[^>]*name=["']keywords["'][^>]*content=["']([^'"]*)["'][^>]*>/i,
    /<meta[^>]*content=["']([^'"]*)["'][^>]*name=["']keywords["'][^>]*>/i,
    /<meta[^>]*property=["']og:keywords["'][^>]*content=["']([^'"]*)["'][^>]*>/i,
    /<meta[^>]*content=["']([^'"]*)["'][^>]*property=["']og:keywords["'][^>]*>/i
  ];
  
  for (const pattern of keywordsPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      keywords = match[1].trim();
      if (keywords) break;
    }
  }

  // First, try to extract main content using semantic HTML5 elements
  const extractContent = (html: string): string => {
    // Try to find main content areas in order of specificity
    const patterns = [
      // Try to get content within <main> or <article> tags first
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      // Then try common content divs
      /<div[^>]*(id|class)=["'][^"']*(content|main|article|post|entry|text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      // If all else fails, get everything between header and footer
      /<body[^>]*>([\s\S]*?)<\/body>/i,
      // Last resort: get everything
      /([\s\S]*)/
    ];

    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches[1]) {
        let content = matches[1];
        // If we matched a class/id pattern, use the captured group
        if (pattern.toString().includes('(id|class)') && matches[3]) {
          content = matches[3];
        }
        
        // If we found some content, clean it up
        if (content.length > 50) { // Arbitrary minimum length to ensure we got actual content
          return content;
        }
      }
    }
    
    return html; // Fallback to original HTML if nothing else works
  };

  // Clean up the HTML while preserving content structure
  const cleanHtml = (html: string): string => {
    // Remove scripts, styles, and other non-content elements
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove empty elements
      .replace(/<[^/>][^>]*><\/[^>]+>/g, '')
      // Remove attributes except for href and src
      .replace(/<([a-zA-Z0-9]+)(\s+[^>]*(href|src)="[^"]*"[^>]*)>/g, '<$1 $3>')
      .replace(/<([a-zA-Z0-9]+)(\s+[^>]*)>/g, '<$1>');
  };

  // Try multiple extraction strategies
  let content = '';
  
  // Strategy 1: Clean HTML first, then extract
  let cleaned = cleanHtml(html);
  content = extractContent(cleaned);
  
  // Strategy 2: If first strategy didn't get enough content, try with original HTML
  if (!content || content.length < 500) {
    const altContent = extractContent(html);
    if (altContent && altContent.length > content.length) {
      content = altContent;
    }
  }
  
  // Strategy 3: If still not enough, try to get everything between body tags
  if (!content || content.length < 500) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      content = bodyMatch[1];
    }
  }
  
  // Final fallback: use the entire HTML
  if (!content || content.length < 100) {
    content = html;
  }

  if (!content) {
    content = '';
  }

  // Clean up the extracted content while preserving formatting
  const cleanExtractedContent = (html: string): string => {
    // Remove only potentially dangerous elements
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/on\w+=\"[^\"]*\"/gi, '') // Remove event handlers
      .replace(/<\?php[\s\S]*?\?>/g, ''); // Remove PHP code

    // Preserve most HTML attributes but clean up potentially harmful ones
    cleaned = cleaned.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (match, tag, attrs) => {
      // List of allowed attributes for most elements
      const allowedAttrs = ['class', 'style', 'href', 'src', 'alt', 'title', 'target', 'rel', 'id', 'name'];
      
      // Special handling for specific tags
      if (tag.toLowerCase() === 'a') {
        allowedAttrs.push(...['href', 'target', 'rel', 'title', 'download']);
      } else if (tag.toLowerCase() === 'img') {
        allowedAttrs.push(...['src', 'alt', 'width', 'height', 'loading', 'sizes', 'srcset']);
      } else if (['table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(tag.toLowerCase())) {
        allowedAttrs.push(...['colspan', 'rowspan', 'scope', 'headers', 'align', 'valign']);
      }

      // Filter attributes
      const filteredAttrs = attrs.replace(/\s*([^=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g, (m: string, name: string, val1: string, val2: string, val3: string) => {
        const value = val1 || val2 || val3 || '';
        const lowerName = name.toLowerCase();
        
        // Skip invalid or potentially dangerous attributes
        if (!name || name.startsWith('on') || name.startsWith('data-') || name.startsWith('aria-')) {
          return '';
        }
        
        // Only include allowed attributes
        if (allowedAttrs.includes(lowerName) && value) {
          return ` ${name}="${value.replace(/"/g, '&quot;')}"`;
        }
        return '';
      }).trim();

      return `<${tag}${filteredAttrs ? ' ' + filteredAttrs : ''}>`;
    });

    // Clean up whitespace but preserve meaningful line breaks
    cleaned = cleaned
      .replace(/\s*<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|thead|tbody|tfoot|section|article|main|header|footer)>/gi, '</$1>\n')
      .replace(/<br[^>]*>\s*/gi, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned;
  };

  // Clean the extracted content
  content = cleanExtractedContent(content);

  // Extract content while preserving structure
  const contentExtractors = [
    { pattern: /<article[^>]*>(.*?)<\/article>/is, group: 1 },
    { pattern: /<main[^>]*>(.*?)<\/main>/is, group: 1 },
    { pattern: /<div[^>]*(id|class)=["'][^"']*(content|main|post)[^"']*["'][^>]*>(.*?)<\/div>/is, group: 3 },
    { pattern: /<body[^>]*>(.*?)<\/body>/is, group: 1 }
  ];

  for (const { pattern, group } of contentExtractors) {
    const match = content.match(pattern);
    if (match && match[group]) {
      content = match[group];
      break;
    }
  }

  // Extract FAQ data from the content if available
  const faqData = extractFAQData(html);
  
  // Remove FAQ section from the main content if found
  let cleanedContent = content;
  if (faqData) {
    cleanedContent = removeFAQSection(content);
  }

  return {
    title,
    description,
    keywords,
    content: cleanedContent,
    originalUrl,
    cleanedHtml: cleanedContent,
    faqData: faqData || { enabled: false, items: [] }
  };
}

// Helper function to extract FAQ data from HTML
function extractFAQData(html: string): { enabled: boolean; items: { question: string; answer: string }[] } | null {
  try {
    // Look for FAQ sections with various patterns
    const faqSectionPatterns = [
      // Section with FAQ heading (case insensitive)
      /<(section|div)[^>]*>\s*<h[1-6][^>]*>\s*(?:FAQs?|Frequently Asked Questions|Common Questions|Questions & Answers|Q & A|Q&A)\s*<\/h[1-6]>(.*?)<\/\1>/is,
      // Div with FAQ class (case insensitive)
      /<(div|section)[^>]*class=["'][^"']*\b(?:faq|faqs|f-a-q|questions?|q-and-a|qna|accordion)\b[^"']*["'][^>]*>(.*?)<\/\1>/is,
      // Details/summary elements (common for accordions)
      /<(div|section)[^>]*>\s*(?:<details[^>]*>\s*<summary[^>]*>.*?<\/summary>.*?<\/details>\s*)+<\/\1>/is,
      // Common FAQ plugin patterns
      /<(div|section)[^>]*(?:class|id)=["'][^"']*\b(?:faq|faqs|accordion|toggle|toggles)\b[^"']*["'][^>]*>.*?<\/\1>/is,
      // Look for any section with multiple h3/h4 followed by content
      /<(div|section)[^>]*>\s*(?:<h[34][^>]*>.*?<\/h[34]>\s*<[^>]*>.*?\s*){2,}<\/\1>/is
    ];
    
    let faqSection = '';
    for (const pattern of faqSectionPatterns) {
      const match = html.match(pattern);
      if (match && (match[2] || match[0])) {
        faqSection = match[2] || match[0];
        console.log('Found FAQ section with pattern:', pattern.toString().substring(0, 100) + '...');
        break;
      }
    }
    
    if (!faqSection) {
      console.log('No FAQ section found in HTML');
      return null;
    }
    
    // Try different patterns to extract Q&A pairs
    const patterns = [
      // Headings followed by content until next heading (h2-h6)
      /<h([2-6])[^>]*>(.*?)<\/h\1>\s*([\s\S]*?)(?=<h[1-6][^>]*>|$)/gi,
      // Details/Summary pattern (common in HTML5 accordions)
      /<details[^>]*>\s*<summary[^>]*>\s*(.*?)\s*<\/summary>\s*([\s\S]*?)\s*<\/details>/gi,
      // DT/DD pattern (definition lists)
      /<dt[^>]*>\s*(.*?)\s*<\/dt>\s*<dd[^>]*>\s*([\s\S]*?)\s*<\/dd>/gi,
      // Div pairs with question/answer classes
      /<(div|p)[^>]*class=["'][^"']*\b(?:question|q|title|heading)\b[^"']*["'][^>]*>\s*(.*?)\s*<\/\1>\s*<(div|p)[^>]*class=["'][^"']*\b(?:answer|a|content|desc)\b[^"']*["'][^>]*>\s*([\s\S]*?)\s*<\/\2>/gi,
      // Common FAQ plugin patterns
      /<(div|h3|h4)[^>]*class=["'][^"']*\b(?:toggle|tgl|accordion-trigger|faq-question)\b[^>]*>\s*(.*?)\s*<\/\1>\s*<(div|p)[^>]*class=["'][^"']*\b(?:toggle-content|tgl-panel|accordion-content|faq-answer)\b[^>]*>\s*([\s\S]*?)\s*<\/\2>/gi
    ];
    
    const items: { question: string; answer: string }[] = [];
    const seen = new Set(); // To avoid duplicates
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(faqSection)) !== null) {
        try {
          // Handle different capture group patterns
          let question = '';
          let answer = '';
          
          if (match[1] && match[2] && match[3]) { // h2-h6 pattern
            question = match[2];
            answer = match[3];
          } else if (match[1] && match[2]) { // details/summary or dt/dd
            question = match[1];
            answer = match[2];
          } else if (match[1] && match[3] && match[4]) { // div pairs with question/answer classes
            question = match[2];
            answer = match[4];
          } else {
            continue; // Skip if pattern doesn't match expected groups
          }
          
          // Clean up the extracted content
          const cleanText = (text: string): string => {
            return text
              .replace(/<[^>]*>/g, ' ') // Remove HTML tags
              .replace(/\s+/g, ' ')     // Collapse whitespace
              .replace(/&(?:amp;)?(?:lt;|gt;|quot);/g, '') // Remove HTML entities
              .replace(/\s*[\r\n]+\s*/g, '\n') // Normalize newlines
              .trim();
          };
          
          question = cleanText(question);
          answer = cleanText(answer);
          
          // Create a unique key for deduplication
          const key = `${question.substring(0, 50)}|${answer.substring(0, 50)}`;
          
          if (question && answer && 
              question.length > 5 && question.length < 200 && 
              answer.length > 10 && answer.length < 2000 &&
              !seen.has(key)) {
            seen.add(key);
            items.push({ question, answer });
            console.log('Extracted FAQ item:', { question: question.substring(0, 50) + '...' });
          }
        } catch (e) {
          console.error('Error processing FAQ item:', e);
        }
      }
      
      // If we found items with this pattern, no need to try others
      if (items.length > 0) {
        console.log(`Extracted ${items.length} FAQ items with pattern:`, pattern.toString().substring(0, 100) + '...');
        break;
      }
    }
    
    console.log(`Total FAQ items extracted: ${items.length}`);
    return items.length > 0 ? { enabled: true, items } : null;
  } catch (error) {
    console.error('Error extracting FAQ data:', error);
    return null;
  }
}

// Helper function to remove FAQ section from HTML
function removeFAQSection(html: string): string {
  try {
    // Remove the FAQ section if it exists
    return html.replace(/<section[^>]*>\s*<h[1-6][^>]*>(?:FAQs?|Frequently Asked Questions)[^<]*<\/h[1-6]>.*?<\/section>/is, '');
  } catch (error) {
    console.error('Error removing FAQ section:', error);
    return html; // Return original HTML if there's an error
  }
}