// Core data types based on API specification
export interface Task {
  id: string;
  name: string;
  status: 'doing' | 'done';
  statusDesc: string;
  createdAt?: Date;
}

export interface Dialogue {
  character: string;
  line: string;
  voiceURL: string; // URL to audio file
}

export interface AnimeScene {
  imageURL: string; // URL to image file
  narration: string;
  narrationVoiceURL?: string; // URL to narration audio file (optional)
  dialogues: Dialogue[];
}

export interface AnimeArtifacts {
  scenes: AnimeScene[];
}

// API request/response types
export interface CreateTaskRequest {
  name: string;
  novel: string;
}

export interface CreateTaskResponse {
  id: string;
}

export interface GetTaskResponse {
  id: string;
  name: string;
  status: 'doing' | 'done';
  statusDesc: string;
}

export interface GetTasksResponse {
  tasks: Task[];
}

export interface DeleteTaskResponse {
  success: boolean;
  message: string;
}

// Application state types
export interface AppState {
  tasks: Task[];
  currentTask: Task | null;
  currentScene: number;
  animeData: AnimeArtifacts | null;
  isLoading: boolean;
  error: string | null;
}

// Action types for state management
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; status: 'doing' | 'done'; statusDesc?: string } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'SET_ANIME_DATA'; payload: AnimeArtifacts | null }
  | { type: 'SET_CURRENT_SCENE'; payload: number }
  | { type: 'RESET_STATE' };

// Audio player state
export interface AudioPlayerState {
  currentlyPlaying: string | null; // dialogue ID or identifier
  isPlaying: boolean;
  volume: number;
}