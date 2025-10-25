import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';
import { useAnime } from '../../hooks/useAnime';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTasks } from '../../hooks/useTasks';
import type { Dialogue } from '../../types';

interface AnimeViewerProps {
  taskId: string;
}

export const AnimeViewer = ({ taskId }: AnimeViewerProps) => {
  const navigate = useNavigate();
  const { 
    animeData, 
    currentScene, 
    isLoading, 
    error, 
    loadAnimeData, 
    getCurrentScene 
  } = useAnime();
  
  const { toggleDialogue, isDialoguePlaying } = useAudioPlayer();
  const { currentTask } = useTasks();

  // Load anime data when component mounts or taskId changes
  useEffect(() => {
    if (taskId && currentTask?.status === 'done') {
      loadAnimeData(taskId);
    }
  }, [taskId, currentTask?.status, loadAnimeData]);

  const handleDialogueClick = async (dialogue: Dialogue, dialogueIndex: number) => {
    try {
      await toggleDialogue(dialogue.voice, currentScene, dialogueIndex);
    } catch (error) {
      console.error('Failed to play dialogue:', error);
    }
  };

  const getCurrentPlayingDialogue = () => {
    const scene = getCurrentScene();
    if (!scene) return -1;
    
    return scene.dialogues.findIndex((_, index) => 
      isDialoguePlaying(currentScene, index)
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <Loading size="lg" text="Loading anime content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <ErrorMessage
          title="Failed to load anime content"
          message={error}
          action={
            <Button onClick={() => loadAnimeData(taskId)} size="sm" variant="secondary">
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (!animeData || !animeData.scenes || animeData.scenes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No anime content available</h3>
        <p className="mt-1 text-sm text-gray-500">
          The conversion task may not be complete yet.
        </p>
      </div>
    );
  }

  const scene = getCurrentScene();
  if (!scene) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Scene not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">返回</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <h2 className="text-lg font-medium text-gray-900">
            星光照和家的味道
          </h2>
          <span className="text-sm text-gray-500">
            {currentScene + 1} / {animeData.scenes.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation buttons */}
          <button 
            className="nav-button text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentScene === 0}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
            title="上一页"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="nav-button text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentScene === animeData.scenes.length - 1}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
            title="下一页"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* Audio control */}
          <button className="nav-button text-gray-400 hover:text-gray-600" title="听书模式">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          
          {/* Fullscreen */}
          <button className="nav-button text-gray-400 hover:text-gray-600" title="全屏">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area - Book-like Layout */}
      <div className="flex-1 bg-gray-100 p-6 ebook-reader">
        <div className="max-w-7xl mx-auto h-full">
          <div className="book-page rounded-lg shadow-lg h-full flex overflow-hidden">
            {/* Left Panel - Image */}
            <div className="flex-1 relative scene-image-container book-page-left">
              {scene.image ? (
                <img
                  src={`data:image/svg+xml;base64,${scene.image}`}
                  alt={`Scene ${currentScene + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-lg text-gray-400">Scene {currentScene + 1}</p>
                    <p className="text-sm text-gray-300">No image available</p>
                  </div>
                </div>
              )}
              
              {/* Scene number overlay */}
              <div className="absolute top-6 right-6 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium">
                {currentScene + 1}
              </div>
            </div>

            {/* Right Panel - Text Content */}
            <div className="flex-1 flex flex-col book-page-right">
              <div className="flex-1 p-12 overflow-y-auto text-content">
                {/* Narration */}
                {scene.narration && (
                  <div className="mb-12">
                    <p className="ebook-narration chinese-serif">
                      {scene.narration}
                    </p>
                  </div>
                )}

                {/* Dialogues */}
                {scene.dialogues && scene.dialogues.length > 0 && (
                  <div className="space-y-6">
                    {scene.dialogues.map((dialogue, index) => {
                      const isCurrentlyPlaying = getCurrentPlayingDialogue() === index;
                      return (
                        <div
                          key={index}
                          onClick={() => handleDialogueClick(dialogue, index)}
                          className={`dialogue-item p-4 cursor-pointer ${
                            isCurrentlyPlaying ? 'playing' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {isCurrentlyPlaying ? (
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="ebook-character-name mb-2">
                                {dialogue.character}
                              </div>
                              <p className="ebook-dialogue chinese-text">
                                "{dialogue.line}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom page indicator */}
              <div className="p-6 border-t border-gray-100 text-center">
                <span className="page-number">{currentScene + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};