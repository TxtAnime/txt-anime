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
    // Task will automatically appear in the dashboard
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setCurrentTask(task);
    
    // Navigate to anime viewer if task is done
    if (task.status === 'done') {
      navigate(`/anime/${task.id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Form */}
      <div className="lg:col-span-2">
        <NovelUploadForm onTaskCreated={handleTaskCreated} />
      </div>
      
      {/* Task Dashboard Sidebar */}
      <div className="lg:col-span-1">
        <TaskDashboard 
          onTaskSelect={handleTaskSelect}
          selectedTask={selectedTask}
        />
      </div>
    </div>
  );
};