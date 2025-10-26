import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TaskService, handleApiError } from '../services/api';
import { storage, STORAGE_KEYS } from '../utils';
import type { Task } from '../types';

export const useTasks = () => {
  const { state, dispatch } = useAppContext();

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await TaskService.getTasks();
      const tasks = response.tasks.map(task => ({
        ...task,
        name: task.name || `Project ${task.id.substring(0, 8)}`,
        statusDesc: task.statusDesc || (task.status === 'done' ? '任务完成' : '处理中'),
        createdAt: new Date(), // API doesn't provide creation time, using current time
      }));

      // Reverse the array to show the last task (newest) first
      const sortedTasks = tasks.reverse();

      dispatch({ type: 'SET_TASKS', payload: sortedTasks });
      
      // Save to localStorage
      storage.setItem(STORAGE_KEYS.TASKS, tasks.map(t => t.id));
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Create new task
  const createTask = useCallback(async (name: string, novel: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await TaskService.createTask(name, novel);
      const newTask: Task = {
        id: response.id,
        name,
        status: 'doing',
        statusDesc: '任务创建中',
        createdAt: new Date(),
      };

      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      // Update localStorage
      const currentTasks = storage.getItem<string[]>(STORAGE_KEYS.TASKS, []);
      storage.setItem(STORAGE_KEYS.TASKS, [newTask.id, ...currentTasks]);

      return newTask;
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw apiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Get task details
  const getTask = useCallback(async (id: string) => {
    try {
      const response = await TaskService.getTask(id);
      const task: Task = {
        ...response,
        name: response.name || `Project ${response.id.substring(0, 8)}`,
        statusDesc: response.statusDesc || (response.status === 'done' ? '任务完成' : '处理中'),
        createdAt: new Date(), // API doesn't provide creation time
      };

      dispatch({ type: 'UPDATE_TASK', payload: { id, status: response.status, statusDesc: response.statusDesc } });
      return task;
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw apiError;
    }
  }, [dispatch]);

  // Set current task
  const setCurrentTask = useCallback((task: Task | null) => {
    dispatch({ type: 'SET_CURRENT_TASK', payload: task });
    
    if (task) {
      storage.setItem(STORAGE_KEYS.CURRENT_TASK, task.id);
    } else {
      storage.removeItem(STORAGE_KEYS.CURRENT_TASK);
    }
  }, [dispatch]);

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await TaskService.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
      
      // Update localStorage
      const currentTasks = storage.getItem<string[]>(STORAGE_KEYS.TASKS, []);
      storage.setItem(STORAGE_KEYS.TASKS, currentTasks.filter(taskId => taskId !== id));

      // Clear current task if it was deleted
      const currentTaskId = storage.getItem<string>(STORAGE_KEYS.CURRENT_TASK, '');
      if (currentTaskId === id) {
        storage.removeItem(STORAGE_KEYS.CURRENT_TASK);
      }

      return true;
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: apiError.message });
      throw apiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Polling for task status updates
  const startPolling = useCallback((taskId: string, interval: number = 5000) => {
    const pollTask = async () => {
      try {
        const task = await getTask(taskId);
        if (task.status === 'done') {
          return true; // Stop polling
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      return false; // Continue polling
    };

    const intervalId = setInterval(async () => {
      const shouldStop = await pollTask();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [getTask]);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks: state.tasks,
    currentTask: state.currentTask,
    isLoading: state.isLoading,
    error: state.error,
    loadTasks,
    createTask,
    getTask,
    deleteTask,
    setCurrentTask,
    startPolling,
  };
};