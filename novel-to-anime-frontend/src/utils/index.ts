/**
 * Convert base64 string to blob for audio playback
 */
export const base64ToBlob = (base64: string, mimeType: string = 'audio/wav'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Create object URL from base64 audio data
 */
export const createAudioUrl = (base64Audio: string): string => {
  const blob = base64ToBlob(base64Audio);
  return URL.createObjectURL(blob);
};

/**
 * Clean up object URL to prevent memory leaks
 */
export const cleanupAudioUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Format task creation time for display
 */
export const formatTaskTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Generate unique ID for dialogues (for audio player tracking)
 */
export const generateDialogueId = (sceneIndex: number, dialogueIndex: number): string => {
  return `scene-${sceneIndex}-dialogue-${dialogueIndex}`;
};

/**
 * Validate novel text input
 */
export const validateNovelText = (text: string): { isValid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Novel text cannot be empty' };
  }
  
  if (text.trim().length < 100) {
    return { isValid: false, error: 'Novel text is too short (minimum 100 characters)' };
  }
  
  if (text.length > 10000) {
    return { isValid: false, error: 'Novel text is too long (maximum 10,000 characters)' };
  }
  
  return { isValid: true };
};

/**
 * Debounce function for API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

/**
 * Local storage utilities
 */
export const storage = {
  setItem: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

/**
 * Constants for localStorage keys
 */
export const STORAGE_KEYS = {
  TASKS: 'novel2anime_tasks',
  CURRENT_TASK: 'novel2anime_current_task',
  SCENE_POSITION: 'novel2anime_scene_position',
} as const;