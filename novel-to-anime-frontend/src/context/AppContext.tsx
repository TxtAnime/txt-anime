import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';

// Initial state
const initialState: AppState = {
  tasks: [],
  currentTask: null,
  currentScene: 0,
  animeData: null,
  isLoading: false,
  error: null,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, status: action.payload.status }
            : task
        ),
        currentTask: state.currentTask?.id === action.payload.id
          ? { ...state.currentTask, status: action.payload.status }
          : state.currentTask,
      };

    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTask: action.payload,
        currentScene: 0, // Reset scene when switching tasks
        animeData: null, // Clear previous anime data
      };

    case 'SET_ANIME_DATA':
      return {
        ...state,
        animeData: action.payload,
        currentScene: 0, // Reset to first scene
      };

    case 'SET_CURRENT_SCENE':
      return {
        ...state,
        currentScene: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};