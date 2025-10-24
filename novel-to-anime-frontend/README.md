# Novel to Anime Frontend

A React-based web application that transforms novels into anime-style visual experiences with images, narration, and character voices.

## Features

- **Novel Upload**: Submit text content for conversion to anime format
- **Task Management**: Monitor conversion progress with real-time status updates
- **Anime Viewer**: View generated scenes with images, narration, and dialogues
- **Audio Playback**: Play character voice audio for dialogues
- **Scene Navigation**: Navigate through scenes with keyboard shortcuts and thumbnails
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + useReducer
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API server running (see API documentation)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `VITE_API_BASE_URL` to point to your backend API server.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## API Configuration

The application expects a backend API with the following endpoints:

- `POST /v1/tasks/` - Create conversion task
- `GET /v1/tasks/` - Get all tasks
- `GET /v1/tasks/:id` - Get task details
- `GET /v1/tasks/:id/artifacts` - Get anime content

See the API documentation for detailed request/response formats.

## Usage

1. **Upload Novel**: Paste your novel text in the upload form and click "Generate Anime"
2. **Monitor Progress**: Watch the task status in the sidebar - tasks show "doing" while processing
3. **View Anime**: Once complete (status "done"), click on a task to view the generated anime
4. **Navigate Scenes**: Use arrow keys, navigation buttons, or thumbnail grid to move between scenes
5. **Play Audio**: Click on character dialogues to hear the generated voices

## Keyboard Shortcuts

- `←` / `→` - Navigate between scenes
- `Home` - Go to first scene
- `End` - Go to last scene

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── novel/          # Novel upload components
│   ├── task/           # Task management components
│   └── anime/          # Anime viewing components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── context/            # React context providers
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Functional components with hooks

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of a hackathon submission.