import { useParams, useNavigate } from 'react-router-dom';
import { AnimeViewer } from '../components/anime/AnimeViewer';
import { SceneNavigator } from '../components/anime/SceneNavigator';
import { AudioPlayer } from '../components/anime/AudioPlayer';
import { useTasks } from '../hooks/useTasks';
import { useEffect } from 'react';

export const AnimeViewerPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentTask, getTask } = useTasks();

  useEffect(() => {
    if (taskId && (!currentTask || currentTask.id !== taskId)) {
      getTask(taskId).catch(() => {
        // If task not found, redirect to home
        navigate('/');
      });
    }
  }, [taskId, currentTask, getTask, navigate]);

  if (!taskId) {
    navigate('/');
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Full-screen Anime Viewer with integrated navigation */}
      <AnimeViewer taskId={taskId} />
      
      {/* Hidden components for functionality - positioned off-screen */}
      <div className="hidden">
        <AudioPlayer />
        <SceneNavigator showThumbnails={false} />
      </div>
    </div>
  );
};