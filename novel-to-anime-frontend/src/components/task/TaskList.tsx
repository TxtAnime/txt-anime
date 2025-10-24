import { TaskCard } from './TaskCard';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
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
      <div className="bg-white rounded-lg shadow p-6">
        <Loading size="md" text="Loading tasks..." />
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <ErrorMessage
          title="Failed to load tasks"
          message={error}
          action={
            <Button onClick={handleRefresh} size="sm" variant="secondary">
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Conversion Tasks
          </h2>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <Loading size="sm" />
            )}
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="ghost"
              disabled={isLoading}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
        {tasks.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </p>
        )}
      </div>

      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a novel to create your first conversion task.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={handleTaskSelect}
                isSelected={task.id === selectedTaskId}
              />
            ))}
          </div>
        )}

        {error && tasks.length > 0 && (
          <div className="mt-4">
            <ErrorMessage
              title="Refresh failed"
              message={error}
              action={
                <Button onClick={handleRefresh} size="sm" variant="secondary">
                  Try Again
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};