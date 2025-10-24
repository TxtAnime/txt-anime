import { useParams, useNavigate } from 'react-router-dom';
import { AnimeViewer } from '../components/anime/AnimeViewer';
import { SceneNavigator } from '../components/anime/SceneNavigator';
import { AudioPlayer } from '../components/anime/AudioPlayer';
import { Button } from '../components/common/Button';
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Anime Viewer */}
      <div className="lg:col-span-3">
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
            
            {currentTask && (
              <div className="text-sm text-gray-600">
                Task: {currentTask.id.substring(0, 8)}...
              </div>
            )}
          </div>

          {/* Audio Player */}
          <AudioPlayer />

          {/* Anime Content */}
          <AnimeViewer taskId={taskId} />
        </div>
      </div>

      {/* Scene Navigator Sidebar */}
      <div className="lg:col-span-1">
        <SceneNavigator showThumbnails={true} />
      </div>
    </div>
  );
};