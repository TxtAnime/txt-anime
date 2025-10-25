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

// Mock base64 image (just the base64 part without data: prefix)
const mockImage = 'PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2ZjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM4YjVjZjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI1MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMjAwIiByPSIzMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIi8+PGNpcmNsZSBjeD0iMzAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2NlbmUgSW1hZ2U8L3RleHQ+PC9zdmc+';

// Mock base64 audio (minimal WAV file - 1 second of silence)
const mockAudio = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Generate mock scenes
function generateMockScenes(novelText) {
  const sceneCount = Math.min(Math.max(Math.floor(novelText.length / 200), 1), 8);
  const scenes = [];
  
  for (let i = 0; i < sceneCount; i++) {
    const scene = {
      imageURL: `data:image/svg+xml;base64,${mockImage}`,
      narration: `到了奶奶家。奶奶穿着她最喜欢的那件围裙，带着大大的拥抱，还有厨房里飘出的香气。`,
      dialogues: [
        {
          character: "奶奶",
          line: `欢迎回家，我的宝贝！快进来，我给你准备了你最爱吃的。`,
          voiceURL: `http://localhost:3001/audio/sample.wav`
        },
        {
          character: "小明",
          line: `奶奶！我好想你！这里的味道还是和以前一样温暖。`,
          voiceURL: `http://localhost:3001/audio/sample.wav`
        }
      ]
    };
    
    // Add some variety to scenes
    if (i % 2 === 0) {
      scene.dialogues.push({
        character: "旁白",
        line: `温暖的阳光透过窗户洒进来，一切都显得那么美好和宁静。`,
        voiceURL: `http://localhost:3001/audio/sample.wav`
      });
    }
    
    scenes.push(scene);
  }
  
  return scenes;
}

// API Routes

// Create task
app.post('/v1/tasks/', (req, res) => {
  const { name, novel } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  if (!novel || typeof novel !== 'string') {
    return res.status(400).json({ error: 'Novel text is required' });
  }
  
  const taskId = uuidv4();
  const task = {
    id: taskId,
    name: name,
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
      console.log(`Task ${taskId} (${name}) completed`);
    }
  }, 10000);
  
  console.log(`Created task ${taskId} "${name}" with novel length: ${novel.length}`);
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
    name: task.name,
    status: task.status
  });
});

// Get all tasks
app.get('/v1/tasks/', (req, res) => {
  const taskList = Array.from(tasks.values()).map(task => ({
    id: task.id,
    name: task.name,
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

// Serve mock audio file
app.get('/audio/sample.wav', (req, res) => {
  // Generate a simple WAV file with a beep sound
  const sampleRate = 44100;
  const duration = 1; // 1 second
  const frequency = 440; // A4 note
  const amplitude = 0.3;
  
  const numSamples = sampleRate * duration;
  const buffer = Buffer.alloc(44 + numSamples * 2); // WAV header + 16-bit samples
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM format
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  
  // Generate sine wave
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude * 32767;
    buffer.writeInt16LE(Math.round(sample), 44 + i * 2);
  }
  
  res.set({
    'Content-Type': 'audio/wav',
    'Content-Length': buffer.length,
    'Cache-Control': 'public, max-age=3600'
  });
  
  res.send(buffer);
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