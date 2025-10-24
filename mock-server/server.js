const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage for tasks
const tasks = new Map();

// Mock base64 image (small transparent PNG)
const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Mock base64 audio (small WAV file)
const mockAudio = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';

// Generate mock scenes
function generateMockScenes(novelText) {
  const sceneCount = Math.min(Math.max(Math.floor(novelText.length / 200), 1), 8);
  const scenes = [];
  
  for (let i = 0; i < sceneCount; i++) {
    const scene = {
      image: mockImage,
      narration: `This is the narration for scene ${i + 1}. The story unfolds as our characters navigate through their journey, revealing deeper meanings and connections.`,
      dialogues: [
        {
          character: "主角",
          line: `这是第${i + 1}个场景中主角的台词。`,
          voice: mockAudio
        },
        {
          character: "配角",
          line: `这是第${i + 1}个场景中配角的回应。`,
          voice: mockAudio
        }
      ]
    };
    
    // Add some variety to scenes
    if (i % 2 === 0) {
      scene.dialogues.push({
        character: "旁白者",
        line: `场景${i + 1}的额外解说内容。`,
        voice: mockAudio
      });
    }
    
    scenes.push(scene);
  }
  
  return scenes;
}

// API Routes

// Create task
app.post('/v1/tasks/', (req, res) => {
  const { novel } = req.body;
  
  if (!novel || typeof novel !== 'string') {
    return res.status(400).json({ error: 'Novel text is required' });
  }
  
  const taskId = uuidv4();
  const task = {
    id: taskId,
    status: 'doing',
    novel: novel,
    createdAt: new Date(),
    scenes: null
  };
  
  tasks.set(taskId, task);
  
  // Simulate processing time - complete after 10 seconds
  setTimeout(() => {
    const task = tasks.get(taskId);
    if (task) {
      task.status = 'done';
      task.scenes = generateMockScenes(novel);
      console.log(`Task ${taskId} completed`);
    }
  }, 10000);
  
  console.log(`Created task ${taskId} with novel length: ${novel.length}`);
  res.json({ id: taskId });
});

// Get task
app.get('/v1/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = tasks.get(id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({
    id: task.id,
    status: task.status
  });
});

// Get all tasks
app.get('/v1/tasks/', (req, res) => {
  const taskList = Array.from(tasks.values()).map(task => ({
    id: task.id,
    status: task.status
  }));
  
  // Sort by creation time, newest first
  taskList.sort((a, b) => {
    const taskA = tasks.get(a.id);
    const taskB = tasks.get(b.id);
    return new Date(taskB.createdAt) - new Date(taskA.createdAt);
  });
  
  res.json({ tasks: taskList });
});

// Get task artifacts
app.get('/v1/tasks/:id/artifacts', (req, res) => {
  const { id } = req.params;
  const task = tasks.get(id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (task.status !== 'done') {
    return res.status(400).json({ error: 'Task not completed yet' });
  }
  
  res.json({ scenes: task.scenes });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    tasks: tasks.size
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   POST /v1/tasks/ - Create task`);
  console.log(`   GET  /v1/tasks/ - Get all tasks`);
  console.log(`   GET  /v1/tasks/:id - Get task details`);
  console.log(`   GET  /v1/tasks/:id/artifacts - Get task artifacts`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n💡 Tasks will complete automatically after 10 seconds`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down mock server...');
  process.exit(0);
});