import { formatTaskTime } from '../../utils';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  isSelected?: boolean;
}

export const TaskCard = ({ task, onSelect, isSelected = false }: TaskCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'doing':
        return {
          badge: 'status-doing',
          icon: (
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          gradient: 'from-amber-400 to-amber-500'
        };
      case 'done':
        return {
          badge: 'status-done',
          icon: (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          gradient: 'from-emerald-400 to-emerald-500'
        };
      default:
        return {
          badge: 'status-badge bg-gray-100 text-gray-600 border-gray-200',
          icon: null,
          gradient: 'from-gray-400 to-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  return (
    <div
      onClick={() => onSelect(task)}
      className={`bg-white rounded-lg p-3 cursor-pointer border transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-700">
            {task.id.substring(0, 8)}...
          </span>
          {task.createdAt && (
            <span className="text-xs text-gray-500">
              {formatTaskTime(task.createdAt)}
            </span>
          )}
        </div>
        
        <div className={statusConfig.badge}>
          {statusConfig.icon}
          <span className="ml-1 capitalize text-xs">{task.status}</span>
        </div>
      </div>
      
      {task.status === 'done' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Ready to view
          </span>
        </div>
      )}

      {task.status === 'doing' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div className="h-full bg-orange-500 rounded-full animate-pulse w-3/5"></div>
            </div>
            <span className="text-xs text-orange-600">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};