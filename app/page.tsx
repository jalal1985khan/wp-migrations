'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  FileText, 
  Settings, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Upload,
  Edit2
} from 'lucide-react';
import RichTextEditor from './components/RichTextEditor';

interface ExtractedContent {
  title: string;
  description: string;
  keywords: string;
  content: string;
  originalUrl: string;
  cleanedHtml: string;
}

interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('extract');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // Update edited content when extracted content changes
  useEffect(() => {
    if (extractedContent) {
      setEditedContent(extractedContent.cleanedHtml);
    }
  }, [extractedContent]);
  const [wordpressConfig, setWordPressConfig] = useState<WordPressConfig>({
    siteUrl: '',
    username: '',
    password: ''
  });
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleExtractContent = async () => {
    if (!sourceUrl) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: sourceUrl }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Failed to extract content');
      }

      const data = await response.json();
      setExtractedContent(data);
      setActiveTab('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handlePublishToWordPress = async () => {
    if (!extractedContent || !wordpressConfig.siteUrl || !wordpressConfig.username || !wordpressConfig.password) {
      setError('Please fill in all WordPress configuration fields');
      return;
    }

    setPublishStatus('publishing');
    setError('');

    try {
      const response = await fetch('/api/publish-to-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: extractedContent,
          config: wordpressConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish to WordPress');
      }

      setPublishStatus('success');
    } catch (err) {
      setPublishStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to publish to WordPress');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WordPress Content Migrator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Extract content from static PHP/HTML websites and migrate them to WordPress 
              while preserving SEO data and formatting
            </p>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mb-6">
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="extract" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Extract
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!extractedContent} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="configure" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure
              </TabsTrigger>
              <TabsTrigger value="publish" disabled={!extractedContent} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Publish
              </TabsTrigger>
            </TabsList>

            {/* Extract Tab */}
            <TabsContent value="extract" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Content Extraction
                  </CardTitle>
                  <CardDescription>
                    Enter the URL of your static PHP/HTML website to extract and clean the content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">Source Website URL</Label>
                    <Input
                      id="sourceUrl"
                      type="url"
                      placeholder="https://example.com/page.php"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">What will be extracted:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Page title and meta description</li>
                      <li>• SEO keywords for Yoast compatibility</li>
                      <li>• Main content (excluding header, footer, scripts)</li>
                      <li>• Clean HTML formatting suitable for WordPress</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleExtractContent} 
                    disabled={isLoading || !sourceUrl}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting Content...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Extract Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              {extractedContent && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        SEO Data
                      </CardTitle>
                      <CardDescription>
                        Extracted SEO information for Yoast SEO
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Page Title</Label>
                          <Input value={extractedContent.title} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Source URL</Label>
                          <Input value={extractedContent.originalUrl} readOnly />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Meta Description</Label>
                        <Textarea 
                          value={extractedContent.description} 
                          readOnly 
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Keywords</Label>
                        <div className="flex flex-wrap gap-2">
                          {extractedContent.keywords.split(',').map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <div className="flex justify-between items-center border-b">
                      <CardHeader>
                        <CardTitle>Content {editMode ? 'Editor' : 'Preview'}</CardTitle>
                        <CardDescription>
                          {editMode 
                            ? 'Edit the content before publishing to WordPress' 
                            : 'Cleaned HTML content ready for WordPress'}
                        </CardDescription>
                      </CardHeader>
                      <div className="pr-6">
                        <Button 
                          variant={editMode ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => setEditMode(!editMode)}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          {editMode ? 'Exit Edit Mode' : 'Edit Content'}
                        </Button>
                      </div>
                    </div>
                    <CardContent className="pt-6">
                      <div className="relative w-full">
                        {!editMode ? (
                          <>
                            {/* Stats bar */}
                            <div className="absolute top-0 right-0 flex gap-2 z-10">
                              <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded border border-gray-200 shadow-sm">
                                {editedContent.length.toLocaleString()} characters
                              </span>
                              <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded border border-gray-200 shadow-sm">
                                {editedContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                              </span>
                              <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded border border-gray-200 shadow-sm">
                                {(editedContent.split('.').length - 1).toLocaleString()} sentences
                              </span>
                            </div>
                            
                            {/* Preview container */}
                            <div 
                              className="wp-admin p-8 overflow-auto max-h-[70vh] w-full bg-white border rounded-lg shadow-sm"
                              style={{ 
                                fontFamily: '"Noto Serif", Georgia, "Times New Roman", serif',
                                fontSize: '16px',
                                lineHeight: '1.75',
                                color: '#1e1e1e',
                                marginTop: '2rem'
                              }}
                            >
                              <div 
                                className="wp-content"
                         
                                dangerouslySetInnerHTML={{ 
                                  __html: editedContent || '<p class="text-gray-400 italic">No content available for preview</p>' 
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <RichTextEditor 
                              content={editedContent}
                              onChange={(content) => {
                                setEditedContent(content);
                                if (extractedContent) {
                                  setExtractedContent({
                                    ...extractedContent,
                                    cleanedHtml: content
                                  });
                                }
                              }}
                              placeholder="Start editing your content here..."
                            />
                            <div className="p-4 bg-gray-50 border-t flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setEditMode(false)}
                                className="mr-2"
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setEditMode(false)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Configure Tab */}
            <TabsContent value="configure" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    WordPress Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your WordPress site connection for content publishing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wpSiteUrl">WordPress Site URL</Label>
                    <Input
                      id="wpSiteUrl"
                      type="url"
                      placeholder="https://yoursite.com"
                      value={wordpressConfig.siteUrl}
                      onChange={(e) => setWordPressConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wpUsername">Username</Label>
                    <Input
                      id="wpUsername"
                      placeholder="WordPress username"
                      value={wordpressConfig.username}
                      onChange={(e) => setWordPressConfig(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wpPassword">Application Password</Label>
                    <Input
                      id="wpPassword"
                      type="password"
                      placeholder="WordPress application password"
                      value={wordpressConfig.password}
                      onChange={(e) => setWordPressConfig(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Important:</h4>
                    <p className="text-sm text-yellow-800">
                      Use an Application Password instead of your regular WordPress password. 
                      You can generate one in your WordPress admin under Users → Your Profile → Application Passwords.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Publish Tab */}
            <TabsContent value="publish" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Publish to WordPress
                  </CardTitle>
                  <CardDescription>
                    Send your extracted content to WordPress with Yoast SEO data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedContent && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Ready to publish:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Title: {extractedContent.title}</li>
                        <li>• Content: {extractedContent.content.length} characters</li>
                        <li>• SEO Description: {extractedContent.description.length} characters</li>
                        <li>• Keywords: {extractedContent.keywords.split(',').length} keywords</li>
                      </ul>
                    </div>
                  )}

                  {publishStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Content successfully published to WordPress with Yoast SEO data!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handlePublishToWordPress}
                    disabled={publishStatus === 'publishing' || !extractedContent}
                    className="w-full"
                    size="lg"
                  >
                    {publishStatus === 'publishing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing to WordPress...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Publish to WordPress
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

}