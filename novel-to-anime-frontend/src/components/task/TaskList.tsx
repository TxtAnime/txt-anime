import { TaskCard } from './TaskCard';
import { Button } from '../common/Button';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types';

interface TaskListProps {
  onTaskSelect?: (task: Task) => void;
  selectedTaskId?: string;
}

export const TaskList = ({ onTaskSelect, selectedTaskId }: TaskListProps) => {
  const { tasks, isLoading, error, loadTasks } = useTasks();

  const handleRefresh = () => {
    loadTasks();
  };

  const handleTaskSelect = (task: Task) => {
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600 text-sm">Loading projects...</span>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Failed to load projects</h3>
            <p className="text-xs text-gray-600 mt-1">{error}</p>
          </div>
          <Button onClick={handleRefresh} size="sm" variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Recent Projects</h3>
          {tasks.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {tasks.length} project{tasks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          onClick={handleRefresh}
          size="sm"
          variant="ghost"
          disabled={isLoading}
          className="p-2"
        >
          <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={handleTaskSelect}
            isSelected={task.id === selectedTaskId}
          />
        ))}
      </div>

      {/* Error message for refresh failures */}
      {error && tasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 animate-slide-up">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-red-800 font-medium">Refresh failed</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <Button onClick={handleRefresh} size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};