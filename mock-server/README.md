# Novel to Anime Mock Server

A mock API server that simulates the novel-to-anime conversion backend for testing the frontend application.

## Features

- **Task Creation**: Accepts novel text and creates conversion tasks
- **Status Simulation**: Tasks automatically change from "doing" to "done" after 10 seconds
- **Mock Data Generation**: Creates realistic anime scenes with images, narration, and dialogues
- **CORS Support**: Configured to work with the frontend development server
- **In-Memory Storage**: Stores tasks temporarily for testing

## API Endpoints

### Create Task
```
POST /v1/tasks/
Content-Type: application/json

{
  "novel": "Your novel text here..."
}

Response:
{
  "id": "uuid-task-id"
}
```

### Get All Tasks
```
GET /v1/tasks/

Response:
{
  "tasks": [
    {
      "id": "uuid-task-id",
      "status": "doing" | "done"
    }
  ]
}
```

### Get Task Details
```
GET /v1/tasks/:id

Response:
{
  "id": "uuid-task-id",
  "status": "doing" | "done"
}
```

### Get Task Artifacts
```
GET /v1/tasks/:id/artifacts

Response:
{
  "scenes": [
    {
      "image": "base64-encoded-png",
      "narration": "Scene narration text",
      "dialogues": [
        {
          "character": "Character name",
          "line": "Dialogue text",
          "voice": "base64-encoded-audio"
        }
      ]
    }
  ]
}
```

### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tasks": 0
}
```

## Usage

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Server will run on**: http://localhost:3000

3. **Test with the frontend**: Make sure your frontend is configured to use `http://localhost:3000` as the API base URL

## Mock Data

- **Images**: Returns a small transparent PNG as base64
- **Audio**: Returns a small WAV file as base64
- **Scenes**: Generates 1-8 scenes based on novel text length
- **Characters**: Uses Chinese character names (主角, 配角, 旁白者)
- **Processing Time**: All tasks complete after exactly 10 seconds

## Development

The server uses:
- **Express.js** for the web server
- **CORS** for cross-origin requests
- **UUID** for generating task IDs
- **In-memory storage** for simplicity

## Testing the Frontend

1. Start the mock server: `npm start`
2. Start the frontend: `cd ../novel-to-anime-frontend && npm run dev`
3. Open http://localhost:5173 in your browser
4. Upload a novel and watch the task progress from "doing" to "done"
5. View the generated anime content once complete

The mock server will log all requests and task status changes to help with debugging.