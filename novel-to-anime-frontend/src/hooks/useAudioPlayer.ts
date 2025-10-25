import { useState, useCallback, useRef, useEffect } from 'react';
import { generateDialogueId } from '../utils';
import type { AudioPlayerState } from '../types';

export const useAudioPlayer = () => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentlyPlaying: null,
    isPlaying: false,
    volume: 1.0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayQueue = useRef<string[]>([]);
  const currentAutoPlayIndex = useRef<number>(-1);

  // Clean up audio resources
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Play audio from URL
  const playAudio = useCallback(async (
    audioUrl: string,
    dialogueId: string
  ) => {
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        cleanup();
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set volume
      audio.volume = playerState.volume;

      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: dialogueId,
          isPlaying: true,
        }));
      });

      audio.addEventListener('ended', () => {
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: null,
          isPlaying: false,
        }));
        cleanup();
        
        // Auto-play next dialogue if in auto-play mode
        playNextInQueue();
      });

      audio.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: null,
          isPlaying: false,
        }));
        cleanup();
      });

      // Start playback
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayerState(prev => ({
        ...prev,
        currentlyPlaying: null,
        isPlaying: false,
      }));
      cleanup();
    }
  }, [playerState.volume, cleanup]);

  // Pause current audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    }
  }, []);

  // Resume current audio
  const resumeAudio = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setPlayerState(prev => ({
          ...prev,
          isPlaying: true,
        }));
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }, []);

  // Stop current audio
  const stopAudio = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      currentlyPlaying: null,
      isPlaying: false,
    }));
    cleanup();
  }, [cleanup]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setPlayerState(prev => ({
      ...prev,
      volume: clampedVolume,
    }));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Play next dialogue in auto-play queue
  const playNextInQueue = useCallback(() => {
    if (autoPlayQueue.current.length > 0 && currentAutoPlayIndex.current < autoPlayQueue.current.length - 1) {
      currentAutoPlayIndex.current += 1;
      // This would need to be implemented with scene data access
      // For now, we'll just clear the queue
      if (currentAutoPlayIndex.current >= autoPlayQueue.current.length - 1) {
        autoPlayQueue.current = [];
        currentAutoPlayIndex.current = -1;
      }
    }
  }, []);

  // Start auto-play for a scene
  const startAutoPlay = useCallback((sceneDialogues: Array<{ voiceURL: string }>, sceneIndex: number) => {
    // Stop current playback
    stopAudio();
    
    // Set up auto-play queue
    autoPlayQueue.current = sceneDialogues.map((_, index) => generateDialogueId(sceneIndex, index));
    currentAutoPlayIndex.current = -1;
    
    // Start with first dialogue
    if (sceneDialogues.length > 0) {
      currentAutoPlayIndex.current = 0;
      const firstDialogueId = autoPlayQueue.current[0];
      playAudio(sceneDialogues[0].voiceURL, firstDialogueId);
    }
  }, [stopAudio, playAudio]);

  // Toggle play/pause for a dialogue
  const toggleDialogue = useCallback(async (
    audioUrl: string,
    sceneIndex: number,
    dialogueIndex: number
  ) => {
    const dialogueId = generateDialogueId(sceneIndex, dialogueIndex);
    
    // Clear auto-play queue when manually selecting dialogue
    autoPlayQueue.current = [];
    currentAutoPlayIndex.current = -1;
    
    if (playerState.currentlyPlaying === dialogueId) {
      if (playerState.isPlaying) {
        pauseAudio();
      } else {
        await resumeAudio();
      }
    } else {
      await playAudio(audioUrl, dialogueId);
    }
  }, [playerState.currentlyPlaying, playerState.isPlaying, playAudio, pauseAudio, resumeAudio]);

  // Play narration (if it has audio)
  const playNarration = useCallback(async (audioUrl: string, sceneIndex: number) => {
    const narrationId = `narration-${sceneIndex}`;
    
    // Clear auto-play queue
    autoPlayQueue.current = [];
    currentAutoPlayIndex.current = -1;
    
    await playAudio(audioUrl, narrationId);
  }, [playAudio]);

  // Check if a specific dialogue is currently playing
  const isDialoguePlaying = useCallback((sceneIndex: number, dialogueIndex: number) => {
    const dialogueId = generateDialogueId(sceneIndex, dialogueIndex);
    return playerState.currentlyPlaying === dialogueId && playerState.isPlaying;
  }, [playerState.currentlyPlaying, playerState.isPlaying]);

  // Check if a specific dialogue is the current one (paused or playing)
  const isDialogueCurrent = useCallback((sceneIndex: number, dialogueIndex: number) => {
    const dialogueId = generateDialogueId(sceneIndex, dialogueIndex);
    return playerState.currentlyPlaying === dialogueId;
  }, [playerState.currentlyPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    playerState,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    setVolume,
    toggleDialogue,
    playNarration,
    startAutoPlay,
    isDialoguePlaying,
    isDialogueCurrent,
  };
};