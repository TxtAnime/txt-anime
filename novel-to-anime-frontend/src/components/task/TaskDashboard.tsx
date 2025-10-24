import { useEffect } from 'react';
import { TaskList } from './TaskList';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types';

interface TaskDashboardProps {
  onTaskSelect?: (task: Task) => void;
  selectedTask?: Task | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const TaskDashboard = ({ 
  onTaskSelect, 
  selectedTask,
  autoRefresh = true,
  refreshInterval = 5000 
}: TaskDashboardProps) => {
  const { tasks, startPolling } = useTasks();

  // Auto-refresh for tasks in progress
  useEffect(() => {
    if (!autoRefresh) return;

    const activeTasks = tasks.filter(task => task.status === 'doing');
    const cleanupFunctions: (() => void)[] = [];

    activeTasks.forEach(task => {
      const cleanup = startPolling(task.id, refreshInterval);
      cleanupFunctions.push(cleanup);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [tasks, autoRefresh, refreshInterval, startPolling]);

  return (
    <div className="space-y-6">
      <TaskList
        onTaskSelect={onTaskSelect}
        selectedTaskId={selectedTask?.id}
      />
      
      {/* Status summary */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Status Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'doing').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};