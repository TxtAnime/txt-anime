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
  const userInteracted = useRef<boolean>(false);

  // Track user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteracted.current = true;
      console.log('User interaction detected, audio playback should now be allowed');
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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
      console.log('Attempting to play audio:', { audioUrl, dialogueId });
      console.log('User interaction detected:', userInteracted.current);
      
      // Check if user has interacted with the page
      if (!userInteracted.current) {
        console.warn('No user interaction detected, audio may be blocked by browser');
      }
      
      // Stop current audio if playing
      if (audioRef.current) {
        cleanup();
      }

      // Validate audio URL
      if (!audioUrl || typeof audioUrl !== 'string') {
        throw new Error('Invalid audio URL');
      }

      // Create new audio element
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set volume
      audio.volume = playerState.volume;

      // Set up event listeners before setting src
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started for:', audioUrl);
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: dialogueId,
          isPlaying: false, // Set to false until actually playing
        }));
      });

      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
      });

      audio.addEventListener('canplay', () => {
        console.log('Audio can play, ready state:', audio.readyState);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
      });

      audio.addEventListener('play', () => {
        console.log('Audio started playing');
        setPlayerState(prev => ({
          ...prev,
          isPlaying: true,
        }));
      });

      audio.addEventListener('pause', () => {
        console.log('Audio paused');
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
        }));
      });

      audio.addEventListener('ended', () => {
        console.log('Audio ended');
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: null,
          isPlaying: false,
        }));
        cleanup();
        
        // Auto-play next dialogue if in auto-play mode
        playNextInQueue();
      });

      audio.addEventListener('error', (event) => {
        const error = (event.target as HTMLAudioElement).error;
        console.error('Audio playback error:', {
          code: error?.code,
          message: error?.message,
          url: audioUrl,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        
        // Show user-friendly error message
        let errorMessage = 'Audio playback failed';
        if (error) {
          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio playback was aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading audio';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio format not supported';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio source not supported';
              break;
          }
        }
        
        console.error('Showing error to user:', errorMessage);
        
        setPlayerState(prev => ({
          ...prev,
          currentlyPlaying: null,
          isPlaying: false,
        }));
        cleanup();
      });

      audio.addEventListener('stalled', () => {
        console.warn('Audio loading stalled');
      });

      audio.addEventListener('suspend', () => {
        console.log('Audio loading suspended');
      });

      audio.addEventListener('waiting', () => {
        console.log('Audio waiting for data');
      });

      // Set the audio source
      audio.src = audioUrl;
      
      // Load the audio
      audio.load();

      // Start playback
      console.log('Starting audio playback...');
      console.log('Audio ready state before play:', audio.readyState);
      console.log('Audio network state before play:', audio.networkState);
      
      const playPromise = audio.play();
      console.log('Audio play() promise created');
      
      await playPromise;
      console.log('Audio playback started successfully');
      console.log('Audio ready state after play:', audio.readyState);
      console.log('Audio network state after play:', audio.networkState);
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      
      // Handle specific browser errors
      let errorMessage = 'Failed to play audio';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Audio playback blocked by browser. Please interact with the page first.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio format not supported by your browser';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      
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