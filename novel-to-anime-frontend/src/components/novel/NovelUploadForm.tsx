import { useState, useRef } from 'react';
import { validateNovelText } from '../../utils';
import { useTasks } from '../../hooks/useTasks';
import { Button } from '../common/Button';

interface NovelUploadFormProps {
  onTaskCreated?: (taskId: string) => void;
}

export const NovelUploadForm = ({ onTaskCreated }: NovelUploadFormProps) => {
  const [projectName, setProjectName] = useState('');
  const [novelText, setNovelText] = useState('在一个遥远的魔法王国里，住着一位年轻的魔法师艾莉娅。她有着一头银白色的长发和深蓝色的眼睛，总是穿着一件深蓝色的魔法袍。艾莉娅虽然年轻，但她的魔法天赋异常出众，特别擅长元素魔法。\n\n这一天，王国突然被一股黑暗力量笼罩，所有的魔法师都感受到了前所未有的威胁。艾莉娅站在魔法塔的顶端，望着远方逐渐逼近的黑云，她知道一场前所未有的战斗即将开始。\n\n"我必须保护这个王国，"艾莉娅坚定地说道，她的眼中闪烁着决心的光芒。她开始吟唱古老的咒语，准备迎接即将到来的挑战。');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileLoadSuccess, setFileLoadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createTask, isLoading, error } = useTasks();

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setNovelText(text);
    
    // Clear validation error and success message when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    if (fileLoadSuccess) {
      setFileLoadSuccess(null);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    // Check file type
    const allowedTypes = ['.txt', '.md', '.rtf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setValidationError(`Unsupported file type. Please select a ${allowedTypes.join(', ')} file.`);
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setValidationError('File size too large. Please select a file smaller than 5MB.');
      return;
    }

    setIsFileLoading(true);
    setValidationError(null);
    setFileLoadSuccess(null);

    try {
      const text = await file.text();
      
      // Extract filename without extension for project name
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      
      // Set project name and content
      setProjectName(fileName);
      setNovelText(text);
      
      // Show success message
      setFileLoadSuccess(`File "${file.name}" loaded successfully! (${text.length.toLocaleString()} characters)`);
      
      console.log('File loaded successfully:', {
        fileName,
        contentLength: text.length,
        fileSize: file.size
      });
      
    } catch (error) {
      console.error('Error reading file:', error);
      setValidationError('Failed to read file. Please try again.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (isLoading || isFileLoading) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
    
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate input
    if (!projectName.trim()) {
      setValidationError('Project name is required');
      return;
    }
    
    const validation = validateNovelText(novelText);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input');
      return;
    }

    try {
      const task = await createTask(projectName.trim(), novelText.trim());
      
      // Clear form on success
      setProjectName('');
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

      {/* File Upload Section */}
      <div 
        style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`, 
          borderRadius: '8px', 
          backgroundColor: isDragOver ? '#eff6ff' : '#f9fafb',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.rtf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading || isFileLoading}
        />
        
        <div style={{ marginBottom: '12px' }}>
          <svg 
            style={{ 
              width: '32px', 
              height: '32px', 
              color: '#9ca3af', 
              margin: '0 auto 8px' 
            }} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>
        
        <p style={{ fontSize: '14px', color: isDragOver ? '#3b82f6' : '#6b7280', marginBottom: '12px' }}>
          {isFileLoading 
            ? 'Loading file...' 
            : isDragOver 
              ? 'Drop your file here' 
              : 'Drag & drop a file here, or click to select'
          }
        </p>
        
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleFileSelect}
          disabled={isLoading || isFileLoading}
          loading={isFileLoading}
        >
          {isFileLoading ? 'Loading...' : 'Select File'}
        </Button>
        
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          Supported formats: .txt, .md, .rtf (max 5MB)
        </p>
      </div>

      {/* Divider */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          flex: 1, 
          height: '1px', 
          backgroundColor: '#e5e7eb' 
        }}></div>
        <span style={{ 
          padding: '0 16px', 
          fontSize: '12px', 
          color: '#9ca3af', 
          backgroundColor: 'white' 
        }}>
          OR ENTER MANUALLY
        </span>
        <div style={{ 
          flex: 1, 
          height: '1px', 
          backgroundColor: '#e5e7eb' 
        }}></div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="project-name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter a name for your project..."
            style={{
              width: '100%',
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
        </div>
        
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

        {fileLoadSuccess && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: '14px', color: '#16a34a', margin: 0 }}>{fileLoadSuccess}</p>
            </div>
          </div>
        )}

        {(validationError || error) && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>{validationError || error}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setProjectName('');
              setNovelText('');
              setValidationError(null);
              setFileLoadSuccess(null);
            }}
            disabled={isLoading || isFileLoading}
          >
            Clear Form
          </Button>
          
          <Button
            type="submit"
            disabled={!projectName.trim() || novelText.trim().length === 0}
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