// components/RichTextEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing your content here...' 
}: RichTextEditorProps) {
  const [value, setValue] = useState(content);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');

  // Set up the editor when component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Update internal state when content prop changes
  useEffect(() => {
    setValue(content);
  }, [content]);

  // Handle content changes
  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  // Toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  if (!isMounted) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b">
          <TabsList className="bg-transparent rounded-none p-0 h-auto">
            <TabsTrigger 
              value="visual" 
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="m-0">
          <div className="min-h-[300px]">
            <ReactQuill
              theme="snow"
              value={value}
              onChange={handleChange}
              modules={modules}
              placeholder={placeholder}
            />
          </div>
          <div>{value}</div>
        </TabsContent>

        <TabsContent value="code" className="m-0">
          <div className="min-h-[300px]">
            <textarea
              className="w-full h-[300px] p-4 border rounded"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              spellCheck="false"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}