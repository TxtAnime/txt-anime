import { useState } from 'react';
import { validateNovelText } from '../../utils';
import { useTasks } from '../../hooks/useTasks';
import { Button } from '../common/Button';

interface NovelUploadFormProps {
  onTaskCreated?: (taskId: string) => void;
}

export const NovelUploadForm = ({ onTaskCreated }: NovelUploadFormProps) => {
  const [novelText, setNovelText] = useState('在一个遥远的魔法王国里，住着一位年轻的魔法师艾莉娅。她有着一头银白色的长发和深蓝色的眼睛，总是穿着一件深蓝色的魔法袍。艾莉娅虽然年轻，但她的魔法天赋异常出众，特别擅长元素魔法。\n\n这一天，王国突然被一股黑暗力量笼罩，所有的魔法师都感受到了前所未有的威胁。艾莉娅站在魔法塔的顶端，望着远方逐渐逼近的黑云，她知道一场前所未有的战斗即将开始。\n\n"我必须保护这个王国，"艾莉娅坚定地说道，她的眼中闪烁着决心的光芒。她开始吟唱古老的咒语，准备迎接即将到来的挑战。');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { createTask, isLoading, error } = useTasks();

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setNovelText(text);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate input
    const validation = validateNovelText(novelText);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input');
      return;
    }

    try {
      const task = await createTask(novelText.trim());
      
      // Clear form on success
      setNovelText('');
      setValidationError(null);
      
      // Notify parent component
      if (onTaskCreated) {
        onTaskCreated(task.id);
      }
    } catch (error) {
      // Error is handled by the useTasks hook
      console.error('Failed to create task:', error);
    }
  };

  const characterCount = novelText.length;
  const maxCharacters = 10000;
  const isNearLimit = characterCount > maxCharacters * 0.9;
  const progressPercentage = Math.min((characterCount / maxCharacters) * 100, 100);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Upload Your Novel</h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Transform your story into an animated experience</p>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="novel-text" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Story Content
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="novel-text"
              value={novelText}
              onChange={handleTextChange}
              placeholder="Paste your novel text here... Include character descriptions, dialogue, and vivid scene details for the best results."
              style={{
                width: '100%',
                height: '200px',
                resize: 'none',
                borderRadius: '8px',
                padding: '12px',
                border: `1px solid ${validationError || error ? '#f87171' : '#d1d5db'}`,
                fontSize: '14px',
                color: '#111827',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              disabled={isLoading}
            />
            
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
              {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
            </div>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '4px' }}>
              <div 
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: isNearLimit ? '#ef4444' : '#3b82f6',
                  width: `${progressPercentage}%`,
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        {(validationError || error) && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '14px', color: '#dc2626' }}>{validationError || error}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            disabled={novelText.trim().length === 0}
            loading={isLoading}
          >
            {isLoading ? 'Processing...' : 'Generate Anime'}
          </Button>
        </div>
      </form>

      <div style={{ marginTop: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af', marginBottom: '8px' }}>Tips for best results:</h3>
        <ul style={{ fontSize: '14px', color: '#1e40af', margin: 0, paddingLeft: '16px' }}>
          <li>Include detailed character descriptions</li>
          <li>Use vivid scene settings</li>
          <li>Write clear dialogue</li>
          <li>Keep length between 100-10,000 characters</li>
        </ul>
      </div>
    </div>
  );
};