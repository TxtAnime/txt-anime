// Core data types based on API specification
export interface Task {
  id: string;
  status: 'doing' | 'done';
  createdAt?: Date;
}

export interface Dialogue {
  character: string;
  line: string;
  voice: string; // base64 encoded audio
}

export interface AnimeScene {
  image: string; // base64 encoded PNG
  narration: string;
  dialogues: Dialogue[];
}

export interface AnimeArtifacts {
  scenes: AnimeScene[];
}

// API request/response types
export interface CreateTaskRequest {
  novel: string;
}

export interface CreateTaskResponse {
  id: string;
}

export interface GetTaskResponse {
  id: string;
  status: 'doing' | 'done';
}

export interface GetTasksResponse {
  tasks: Task[];
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
  | { type: 'UPDATE_TASK'; payload: { id: string; status: 'doing' | 'done' } }
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