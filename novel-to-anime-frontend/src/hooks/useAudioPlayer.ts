import { useState, useCallback, useRef, useEffect } from 'react';
import { createAudioUrl, cleanupAudioUrl, generateDialogueId } from '../utils';
import type { AudioPlayerState } from '../types';

export const useAudioPlayer = () => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentlyPlaying: null,
    isPlaying: false,
    volume: 1.0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);

  // Clean up audio resources
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentAudioUrl.current) {
      cleanupAudioUrl(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
  }, []);

  // Play audio from base64 data
  const playAudio = useCallback(async (
    base64Audio: string,
    dialogueId: string
  ) => {
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        cleanup();
      }

      // Create new audio element
      const audioUrl = createAudioUrl(base64Audio);
      currentAudioUrl.current = audioUrl;
      
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

  // Toggle play/pause for a dialogue
  const toggleDialogue = useCallback(async (
    base64Audio: string,
    sceneIndex: number,
    dialogueIndex: number
  ) => {
    const dialogueId = generateDialogueId(sceneIndex, dialogueIndex);
    
    if (playerState.currentlyPlaying === dialogueId) {
      if (playerState.isPlaying) {
        pauseAudio();
      } else {
        await resumeAudio();
      }
    } else {
      await playAudio(base64Audio, dialogueId);
    }
  }, [playerState.currentlyPlaying, playerState.isPlaying, playAudio, pauseAudio, resumeAudio]);

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
    isDialoguePlaying,
    isDialogueCurrent,
  };
};