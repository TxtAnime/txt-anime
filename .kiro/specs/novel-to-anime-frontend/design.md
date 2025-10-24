# Design Document

## Overview

The Novel-to-Anime Frontend is a React-based single-page application that provides an intuitive interface for users to convert novels into anime format. The application features a clean, modern design optimized for viewing multimedia content with seamless navigation between scenes and integrated audio playback.

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **State Management**: React Context API + useReducer for global state
- **Styling**: Tailwind CSS for responsive design
- **HTTP Client**: Axios for API communication
- **Audio Handling**: Web Audio API for voice playback
- **Build Tool**: Vite for fast development and optimized builds

### Application Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── novel/           # Novel input related components
│   ├── task/            # Task management components
│   └── anime/           # Anime viewing components
├── pages/               # Main application pages
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── context/             # React context providers
```

## Components and Interfaces

### Core Components

#### 1. NovelUploadForm
**Purpose**: Handle novel text input and submission
- Large textarea for novel content input
- Character count display
- Submit button with loading state
- Form validation and error display

#### 2. TaskDashboard
**Purpose**: Display and manage conversion tasks
- Task list with ID, status, and creation time
- Real-time status updates using polling
- Quick access to view completed tasks
- Task filtering and sorting options

#### 3. AnimeViewer
**Purpose**: Display generated anime content
- Scene navigation with thumbnail strip
- Image display with proper aspect ratio handling
- Narration text overlay
- Character dialogue list with voice controls
- Fullscreen viewing mode

#### 4. AudioPlayer
**Purpose**: Handle voice playback for dialogues
- Play/pause controls for each dialogue
- Visual indicators for currently playing audio
- Progress bar for audio playback
- Volume control

#### 5. SceneNavigator
**Purpose**: Navigate between anime scenes
- Previous/Next scene buttons
- Scene counter (current/total)
- Thumbnail overview grid
- Keyboard navigation support

### API Service Layer

#### TaskService
```typescript
interface TaskService {
  createTask(novel: string): Promise<{ id: string }>;
  getTask(id: string): Promise<{ id: string; status: string }>;
  getTasks(): Promise<{ tasks: Array<{ id: string; status: string }> }>;
  getTaskArtifacts(id: string): Promise<AnimeArtifacts>;
}
```

#### Types Definition
```typescript
interface AnimeScene {
  image: string;           // base64 PNG
  narration: string;
  dialogues: Dialogue[];
}

interface Dialogue {
  character: string;
  line: string;
  voice: string;          // base64 audio
}

interface AnimeArtifacts {
  scenes: AnimeScene[];
}

interface Task {
  id: string;
  status: 'doing' | 'done';
  createdAt?: Date;
}
```

## Data Models

### Application State
```typescript
interface AppState {
  tasks: Task[];
  currentTask: Task | null;
  currentScene: number;
  animeData: AnimeArtifacts | null;
  isLoading: boolean;
  error: string | null;
}
```

### Local Storage Schema
- `novel2anime_tasks`: Array of task IDs for persistence
- `novel2anime_current_task`: Currently selected task ID
- `novel2anime_scene_position`: Current scene position per task

## User Interface Design

### Layout Structure
1. **Header**: Application title and navigation
2. **Main Content Area**: Dynamic content based on current view
3. **Sidebar**: Task list and quick actions (collapsible on mobile)
4. **Footer**: Status information and controls

### Page Flow
1. **Home/Upload Page**: Novel input form with recent tasks sidebar
2. **Task Dashboard**: List view of all tasks with status indicators
3. **Anime Viewer**: Full-screen anime content with navigation controls

### Responsive Design
- **Desktop**: Three-column layout (sidebar, main content, scene navigator)
- **Tablet**: Two-column layout with collapsible sidebar
- **Mobile**: Single-column stack with bottom navigation

## Error Handling

### API Error Handling
- Network errors: Retry mechanism with exponential backoff
- Server errors: User-friendly error messages with retry options
- Validation errors: Inline form validation with clear feedback

### Audio Playback Errors
- Unsupported format fallback
- Loading failure notifications
- Graceful degradation for browsers without audio support

### Image Loading Errors
- Placeholder images for failed loads
- Progressive loading indicators
- Retry mechanism for base64 decode failures

## Testing Strategy

### Unit Testing
- Component rendering and prop handling
- API service functions and error scenarios
- Utility functions for data transformation
- Audio and image handling utilities

### Integration Testing
- Complete user workflows (upload → view → navigate)
- API integration with mock server responses
- State management across component interactions

### End-to-End Testing
- Full application flow from novel upload to anime viewing
- Cross-browser compatibility testing
- Mobile responsiveness validation
- Audio playback functionality across devices

### Performance Testing
- Large novel text handling
- Multiple scene navigation performance
- Memory usage with base64 media content
- Network request optimization

## Performance Optimizations

### Media Handling
- Lazy loading for scene images
- Audio preloading for smoother playback
- Base64 caching to avoid re-decoding
- Image compression and optimization

### State Management
- Memoization for expensive computations
- Selective re-rendering with React.memo
- Debounced API calls for status updates
- Efficient task list updates

### Network Optimization
- Request batching where possible
- Caching strategies for task data
- Progressive loading of anime content
- Optimistic UI updates for better UX

## Security Considerations

### Data Handling
- Client-side validation for novel content
- Sanitization of user input before display
- Secure handling of base64 media content

### API Communication
- HTTPS enforcement for all API calls
- Request timeout handling
- Rate limiting awareness and user feedback