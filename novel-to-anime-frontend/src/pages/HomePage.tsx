import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NovelUploadForm } from '../components/novel/NovelUploadForm';
import { TaskDashboard } from '../components/task/TaskDashboard';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types';

export const HomePage = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { setCurrentTask } = useTasks();
  const navigate = useNavigate();

  const handleTaskCreated = (taskId: string) => {
    console.log('Task created:', taskId);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setCurrentTask(task);
    
    if (task.status === 'done') {
      navigate(`/anime/${task.id}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          Transform Stories into Anime
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto 24px' }}>
          Upload your novel and watch as AI brings your characters and scenes to life with stunning visuals and immersive audio.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>🎨</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>AI Visuals</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#8b5cf6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>🎵</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Voice Narration</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f97316', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>🎭</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Character Voices</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'stretch' }}>
        {/* Left Side - Projects */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TaskDashboard 
            onTaskSelect={handleTaskSelect}
            selectedTask={selectedTask}
          />
        </div>
        
        {/* Right Side - Upload Form */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <NovelUploadForm onTaskCreated={handleTaskCreated} />
        </div>
      </div>
    </div>
  );
};