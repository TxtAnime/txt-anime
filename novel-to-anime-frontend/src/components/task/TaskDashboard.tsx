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

  const inProgressCount = tasks.filter(t => t.status === 'doing').length;
  const completedCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px',
      height: '100%',
      flex: '1 1 auto'
    }}>
      {/* Stats Overview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        flex: '0 0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '18px', height: '18px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Your Projects</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Track your anime generation progress</p>
          </div>
        </div>

        {tasks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div 
              style={{
                background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #fde68a',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '14px', height: '14px', color: 'white', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>{inProgressCount}</div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#d97706' }}>Processing</div>
                </div>
              </div>
            </div>
            
            <div 
              style={{
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #a7f3d0',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #34d399, #10b981)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '14px', height: '14px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#065f46' }}>{completedCount}</div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#059669' }}>Complete</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Start with the upload form</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Project List */}
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <TaskList
          onTaskSelect={onTaskSelect}
          selectedTaskId={selectedTask?.id}
        />
      </div>
    </div>
  );
};