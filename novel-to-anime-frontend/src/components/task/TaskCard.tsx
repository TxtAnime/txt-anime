import { formatTaskTime } from '../../utils';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  isSelected?: boolean;
}

export const TaskCard = ({ task, onSelect, isSelected = false }: TaskCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'doing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'doing':
        return (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'done':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-600">
            {task.id.substring(0, 8)}...
          </span>
          {isSelected && (
            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          {getStatusIcon(task.status)}
          <span className="ml-1 capitalize">{task.status}</span>
        </div>
      </div>
      
      {task.createdAt && (
        <p className="text-xs text-gray-500">
          Created {formatTaskTime(task.createdAt)}
        </p>
      )}
      
      {task.status === 'done' && (
        <div className="mt-2">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View Anime →
          </button>
        </div>
      )}
    </div>
  );
};