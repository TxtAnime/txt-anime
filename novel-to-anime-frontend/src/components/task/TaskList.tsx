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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-8 h-8 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Loading projects</p>
            <p className="text-gray-500 text-sm">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-sm border border-red-200">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Unable to load projects</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <Button onClick={handleRefresh} size="sm" variant="secondary" className="bg-white hover:bg-gray-50">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        padding: '16px 20px',
        flex: '0 0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '14px', height: '14px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Recent Projects
              </h3>
              {tasks.length > 0 && (
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                  {tasks.length} project{tasks.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '6px',
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg 
              style={{ 
                width: '16px', 
                height: '16px',
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div style={{ 
        padding: '20px', 
        flex: '1 1 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {tasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px 0',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <svg style={{ width: '24px', height: '24px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 6px 0' }}>No projects yet</h4>
            <p style={{ color: '#6b7280', margin: '0 0 12px 0', fontSize: '13px' }}>Upload a novel to start creating your first anime project</p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#2563eb',
              backgroundColor: '#eff6ff',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #dbeafe'
            }}>
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>Get started with the upload form</span>
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: '1 1 auto',
            overflowY: 'auto',
            marginRight: '-8px',
            paddingRight: '8px'
          }}>
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
      </div>

      {/* Error message for refresh failures */}
      {error && tasks.length > 0 && (
        <div style={{
          margin: '0 20px 20px 20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          flex: '0 0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#fecaca',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{ width: '12px', height: '12px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600', margin: 0 }}>Refresh failed</p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                fontSize: '12px',
                color: '#dc2626',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fecaca';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};