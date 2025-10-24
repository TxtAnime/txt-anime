import { useState } from 'react';
import { validateNovelText } from '../../utils';
import { useTasks } from '../../hooks/useTasks';

interface NovelUploadFormProps {
  onTaskCreated?: (taskId: string) => void;
}

export const NovelUploadForm = ({ onTaskCreated }: NovelUploadFormProps) => {
  const [novelText, setNovelText] = useState('');
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
  const maxCharacters = 100000;
  const isNearLimit = characterCount > maxCharacters * 0.9;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Novel</h2>
      <p className="text-gray-600 mb-6">
        Paste your novel text below to generate an anime adaptation. The system will create scenes with images, narration, and character voices.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="novel-text" className="block text-sm font-medium text-gray-700 mb-2">
            Novel Text
          </label>
          <textarea
            id="novel-text"
            value={novelText}
            onChange={handleTextChange}
            placeholder="Enter your novel text here..."
            className={`w-full h-64 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
              validationError || error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-2">
            <div className={`text-sm ${isNearLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
            </div>
            {characterCount > 0 && (
              <button
                type="button"
                onClick={() => setNovelText('')}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || novelText.trim().length === 0}
            className={`px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isLoading || novelText.trim().length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Task...
              </div>
            ) : (
              'Generate Anime'
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Tips for better results:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Include clear character descriptions and dialogue</li>
          <li>• Use descriptive scene settings and actions</li>
          <li>• Separate chapters or scenes with clear breaks</li>
          <li>• Minimum 10 characters, maximum 100,000 characters</li>
        </ul>
      </div>
    </div>
  );
};