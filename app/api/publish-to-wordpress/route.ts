import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, config } = await request.json();

    if (!content || !config.siteUrl || !config.username || !config.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // WordPress REST API endpoint
    const wpApiUrl = `${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages`;

    // Prepare the post data
    const postData = {
      title: content.title,
      content: content.cleanedHtml,
      status: 'draft', // Create as draft first
      meta: {
        // Yoast SEO meta fields
        _yoast_wpseo_title: content.title,
        _yoast_wpseo_metadesc: content.description,
        _yoast_wpseo_focuskw: content.keywords.split(',')[0]?.trim() || '',
        _yoast_wpseo_metakeywords: content.keywords
      },
      // Custom fields for additional SEO data
      custom_fields: [
        {
          key: 'original_url',
          value: content.originalUrl
        },
        {
          key: 'migration_date',
          value: new Date().toISOString()
        }
      ]
    };

    // Create authentication header
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

    // Make the request to WordPress
    const response = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    // If Yoast is installed, update SEO data via separate API call
    try {
      await updateYoastSeoData(config, result.id, {
        title: content.title,
        description: content.description,
        keywords: content.keywords
      });
    } catch (yoastError) {
      console.warn('Could not update Yoast SEO data:', yoastError);
      // Continue anyway as the main content was published
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      postUrl: result.link,
      message: 'Content successfully published to WordPress'
    });

  } catch (error) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: `Failed to publish to WordPress: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function updateYoastSeoData(config: any, postId: number, seoData: any) {
  // Update Yoast SEO data using WordPress meta API
  const metaUrl = `${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages/${postId}`;
  
  const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  
  const updateData = {
    meta: {
      _yoast_wpseo_title: seoData.title,
      _yoast_wpseo_metadesc: seoData.description,
      _yoast_wpseo_focuskw: seoData.keywords.split(',')[0]?.trim() || '',
      _yoast_wpseo_metakeywords: seoData.keywords
    }
  };

  const response = await fetch(metaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    throw new Error(`Failed to update Yoast SEO data: ${response.statusText}`);
  }

  return response.json();
}