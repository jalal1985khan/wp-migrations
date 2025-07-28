'use client';

import ReactQuillEditor from './ReactQuillEditor';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your content here...',
  className = '',
}) => {
  return (
    <ReactQuillEditor
      value={content}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default RichTextEditor;
