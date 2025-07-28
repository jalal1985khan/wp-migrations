import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract content using regex patterns (server-side HTML parsing)
    const extractedContent = extractContentFromHtml(html, url);

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

  // Extract keywords
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["']/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

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

  return {
    title,
    description,
    keywords,
    // content: content.replace(/<[^>]*>/g, '').substring(0, 500) + '...', // Plain text preview
    content: content,
    originalUrl,
    cleanedHtml: content
  };
}