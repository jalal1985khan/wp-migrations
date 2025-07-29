'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, X, Save } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQEditorProps {
  faqs: FAQItem[];
  onChange: (faqs: FAQItem[]) => void;
}

export default function FAQEditor({ faqs = [], onChange }: FAQEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [items, setItems] = useState<FAQItem[]>(faqs);
  const [currentItem, setCurrentItem] = useState<FAQItem>({ question: '', answer: '' });

  useEffect(() => {
    setItems(faqs);
  }, [faqs]);

  const handleAddNew = () => {
    setEditingIndex(-1);
    setCurrentItem({ question: '', answer: '' });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setCurrentItem(items[index]);
  };

  const handleSave = () => {
    const newItems = [...items];
    if (editingIndex === -1) {
      newItems.push(currentItem);
    } else {
      newItems[editingIndex] = currentItem;
    }
    setItems(newItems);
    onChange(newItems);
    setEditingIndex(null);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">FAQ Items</h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleAddNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {editingIndex !== null && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div>
            <label className="text-sm font-medium mb-1 block">Question</label>
            <Input
              value={currentItem.question}
              onChange={(e) => setCurrentItem({ ...currentItem, question: e.target.value })}
              placeholder="Enter question"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Answer</label>
            <Textarea
              value={currentItem.answer}
              onChange={(e) => setCurrentItem({ ...currentItem, answer: e.target.value })}
              placeholder="Enter answer (supports HTML)"
              rows={4}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditingIndex(null)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!currentItem.question || !currentItem.answer}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((faq, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{faq.question}</h4>
                <div 
                  className="text-sm text-gray-600 mt-1"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && editingIndex === null && (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
            No FAQ items added yet. Click "Add FAQ" to get started.
          </div>
        )}
      </div>
    </div>
  );
}


// interface FAQEditorProps {
//   faqs: FAQItem[];
//   onChange: (items: FAQItem[]) => void;
// }

// export default function FAQEditor({ faqs, onChange }: FAQEditorProps) {
//   return (
//     <div className="space-y-4">
//       {faqs.map((faq, index) => (
//         <div key={index} className="border rounded-lg p-4">
//           <h4 className="font-medium">{faq.question}</h4>
//           <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
//         </div>
//       ))}
//     </div>
//   );
// }