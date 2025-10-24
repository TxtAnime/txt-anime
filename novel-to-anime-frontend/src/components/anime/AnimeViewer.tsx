import { useEffect } from 'react';
import { AnimeScene } from './AnimeScene';
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
    <div className="space-y-6">
      {/* Scene Progress */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Scene {currentScene + 1} of {animeData.scenes.length}
          </span>
          <span className="text-xs text-gray-500">
            Use arrow keys to navigate
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentScene + 1) / animeData.scenes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Scene */}
      <AnimeScene
        scene={scene}
        sceneIndex={currentScene}
        onDialogueClick={handleDialogueClick}
        playingDialogueIndex={getCurrentPlayingDialogue()}
      />

      {/* Scene Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Dialogues:</span>
            <span className="ml-2 text-gray-600">{scene.dialogues?.length || 0}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Scenes:</span>
            <span className="ml-2 text-gray-600">{animeData.scenes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};