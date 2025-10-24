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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="glass-effect-strong rounded-3xl p-6 shadow-large relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="md"
              className="flex items-center space-x-2 hover:bg-white/50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </Button>
            
            {currentTask && (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-soft floating">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold gradient-text">Anime Viewer</h1>
                  <p className="text-gray-600">Project: {currentTask.id.substring(0, 8)}...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="status-done px-4 py-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-2">Ready to Watch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Anime Viewer */}
        <div className="xl:col-span-3 space-y-8">
          {/* Audio Player */}
          <div className="glass-effect-strong rounded-3xl p-6 shadow-large card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-soft">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-gray-800">Audio Controls</h3>
                <p className="text-sm text-gray-600">Immersive narration and character voices</p>
              </div>
            </div>
            <AudioPlayer />
          </div>

          {/* Anime Content */}
          <div className="glass-effect-strong rounded-3xl shadow-large overflow-hidden card-hover">
            <AnimeViewer taskId={taskId} />
          </div>
        </div>

        {/* Scene Navigator Sidebar */}
        <div className="xl:col-span-1">
          <div className="sticky top-24">
            <div className="glass-effect-strong rounded-3xl p-6 shadow-large card-hover">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-soft">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-gray-800">Scenes</h3>
                  <p className="text-sm text-gray-600">Navigate through your story</p>
                </div>
              </div>
              <SceneNavigator showThumbnails={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};