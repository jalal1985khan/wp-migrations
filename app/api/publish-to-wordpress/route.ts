import { NextRequest, NextResponse } from 'next/server';

interface ContentData {
  title: string;
  description: string;
  keywords: string;
  cleanedHtml: string;
  originalUrl: string;
  slug:string;
  [key: string]: any;
}

interface WordPressConfig {
  siteUrl?: string;
  [key: string]: any; // For backward compatibility
}

// Get the secure token from environment variables
const WORDPRESS_API_TOKEN = process.env.WORDPRESS_API_TOKEN || 'OXl6gPX17QBOxK/CArKl8jP/ZRPOt1VJZ4R9OjtRyCw=';
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://wordpress.buddyloan.com';

export async function POST(request: NextRequest) {
  try {
    const { content, config } = await request.json() as { content: ContentData; config?: WordPressConfig };
    
    // Validate required fields
    if (!content?.title || !content.cleanedHtml) {
      const missingFields = [];
      if (!content?.title) missingFields.push('content.title');
      if (!content?.cleanedHtml) missingFields.push('content.cleanedHtml');
      
      console.error('Missing required content fields:', missingFields);
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }
    
    const apiUrl = `${WORDPRESS_API_URL}/wp-json/content-migration/v1/migrate-post`;
    
    console.log('Sending request to WordPress API:', {
      url: apiUrl,
      title: content.title.substring(0, 50) + (content.title.length > 50 ? '...' : ''),
      slug:content.originalUrl ? new URL(content.originalUrl).pathname.replace(/^\/|\/$/g, '') : '',
      contentLength: content.cleanedHtml?.length || 0
    });
    
    // Extract slug from originalUrl if available
    const slug = content.originalUrl ? new URL(content.originalUrl).pathname.replace(/^\/|\/$/g, '') : '';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORDPRESS_API_TOKEN}`
      },
      body: JSON.stringify({
        title: content.title,
        content: content.cleanedHtml,
        status: 'draft',
        slug:content.originalUrl ? new URL(content.originalUrl).pathname.replace(/^\/|\/$/g, '') : '', // Add the slug to the post data
        meta: {
          '_yoast_wpseo_title': content.title,
          '_yoast_wpseo_metadesc': content.description,
          '_yoast_wpseo_focuskw': content.keywords?.split(',')[0]?.trim() || '',
          '_yoast_wpseo_metakeywords': content.keywords,
          '_wp_old_slug': slug // Also store as old slug to prevent redirects
        },
        custom_fields: [
          { key: 'original_url', value: content.originalUrl },
          { key: 'migration_date', value: new Date().toISOString() }
        ]
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('WordPress API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      
      return NextResponse.json({
        success: false,
        error: responseData?.message || 'Failed to publish to WordPress',
        details: responseData
      }, { status: response.status });
    }
    
    console.log('Successfully published to WordPress:', {
      postId: responseData.post_id,
      editLink: responseData.edit_link
    });
    
    return NextResponse.json({
      success: true,
      data: responseData,
      slug:content.originalUrl ? new URL(content.originalUrl).pathname.replace(/^\/|\/$/g, '') : '',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in publish-to-wordpress route:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}