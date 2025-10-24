import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TaskService, handleApiError } from '../services/api';
import { storage, STORAGE_KEYS } from '../utils';

export const useAnime = () => {
  const { state, dispatch } = useAppContext();

  // Load anime data for current task
  const loadAnimeData = useCallback(async (taskId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const animeData = await TaskService.getTaskArtifacts(taskId);
      dispatch({ type: 'SET_ANIME_DATA', payload: animeData });

      return animeData;
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw apiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Navigate to specific scene
  const goToScene = useCallback((sceneIndex: number) => {
    if (state.animeData && sceneIndex >= 0 && sceneIndex < state.animeData.scenes.length) {
      dispatch({ type: 'SET_CURRENT_SCENE', payload: sceneIndex });
      
      // Save scene position to localStorage
      if (state.currentTask) {
        const scenePositions = storage.getItem<Record<string, number>>(STORAGE_KEYS.SCENE_POSITION, {});
        scenePositions[state.currentTask.id] = sceneIndex;
        storage.setItem(STORAGE_KEYS.SCENE_POSITION, scenePositions);
      }
    }
  }, [state.animeData, state.currentTask, dispatch]);

  // Navigate to next scene
  const nextScene = useCallback(() => {
    if (state.animeData && state.currentScene < state.animeData.scenes.length - 1) {
      goToScene(state.currentScene + 1);
    }
  }, [state.animeData, state.currentScene, goToScene]);

  // Navigate to previous scene
  const previousScene = useCallback(() => {
    if (state.currentScene > 0) {
      goToScene(state.currentScene - 1);
    }
  }, [state.currentScene, goToScene]);

  // Get current scene data
  const getCurrentScene = useCallback(() => {
    if (state.animeData && state.animeData.scenes[state.currentScene]) {
      return state.animeData.scenes[state.currentScene];
    }
    return null;
  }, [state.animeData, state.currentScene]);

  // Keyboard navigation
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        previousScene();
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextScene();
        break;
      case 'Home':
        event.preventDefault();
        goToScene(0);
        break;
      case 'End':
        event.preventDefault();
        if (state.animeData) {
          goToScene(state.animeData.scenes.length - 1);
        }
        break;
    }
  }, [previousScene, nextScene, goToScene, state.animeData]);

  // Set up keyboard navigation
  useEffect(() => {
    if (state.animeData) {
      document.addEventListener('keydown', handleKeyNavigation);
      return () => {
        document.removeEventListener('keydown', handleKeyNavigation);
      };
    }
  }, [handleKeyNavigation, state.animeData]);

  // Restore scene position when task changes
  useEffect(() => {
    if (state.currentTask && state.animeData) {
      const scenePositions = storage.getItem<Record<string, number>>(STORAGE_KEYS.SCENE_POSITION, {});
      const savedPosition = scenePositions[state.currentTask.id];
      
      if (savedPosition !== undefined && savedPosition < state.animeData.scenes.length) {
        dispatch({ type: 'SET_CURRENT_SCENE', payload: savedPosition });
      }
    }
  }, [state.currentTask, state.animeData, dispatch]);

  return {
    animeData: state.animeData,
    currentScene: state.currentScene,
    isLoading: state.isLoading,
    error: state.error,
    loadAnimeData,
    goToScene,
    nextScene,
    previousScene,
    getCurrentScene,
    totalScenes: state.animeData?.scenes.length || 0,
    hasNextScene: state.animeData ? state.currentScene < state.animeData.scenes.length - 1 : false,
    hasPreviousScene: state.currentScene > 0,
  };
};