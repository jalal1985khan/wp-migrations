'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50 flex items-center justify-center">
      Loading editor...
    </div>
  ),
});

interface ReactQuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const ReactQuillEditor: React.FC<ReactQuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your content here...',
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [editorHtml, setEditorHtml] = useState(value);

  // Update local state when value prop changes
  useEffect(() => {
    setEditorHtml(value);
  }, [value]);

  // Set mounted state to handle SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Editor modules configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['code-block'],
      ],
    }),
    []
  );

  // Editor formats configuration
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'link',
    'image',
    'color',
    'background',
    'align',
    'code-block',
  ];

  const handleChange = (content: string) => {
    setEditorHtml(content);
    onChange(content);
  };

  if (!isMounted) {
    return (
      <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50 flex items-center justify-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {isMounted && (
        <ReactQuill
          theme="snow"
          value={editorHtml}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="min-h-[400px]"
        />
      )}
    </div>
  );
};

export default ReactQuillEditor;
