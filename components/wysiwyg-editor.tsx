'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Code, Edit3 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface WysiwygEditorProps {
  content: string;
  title: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

export default function WysiwygEditor({ 
  content, 
  title, 
  onContentChange, 
  readOnly = false 
}: WysiwygEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [activeTab, setActiveTab] = useState('visual');

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleContentChange = (value: string) => {
    setEditorContent(value);
    onContentChange?.(value);
  };

  // Quill modules configuration (WordPress-like toolbar)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background', 'align',
    'code-block'
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Visual Editor Tab */}
          <TabsContent value="visual" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={editorContent}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                readOnly={readOnly}
                style={{
                  minHeight: '400px',
                  backgroundColor: 'white'
                }}
                className="wordpress-editor"
              />
            </div>
          </TabsContent>

          {/* HTML Code Tab */}
          <TabsContent value="code" className="mt-4">
            <div className="border rounded-lg">
              <textarea
                value={editorContent}
                onChange={(e) => handleContentChange(e.target.value)}
                readOnly={readOnly}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HTML content..."
              />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-6 bg-white min-h-96">
              <div 
                className="prose prose-lg max-w-none wordpress-content"
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {!readOnly && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditorContent(content)}>
              Reset
            </Button>
            <Button onClick={() => onContentChange?.(editorContent)}>
              Update Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}