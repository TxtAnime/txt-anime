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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Your Projects</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Track your anime generation progress</p>
        </div>

        {tasks.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ea580c' }}>{inProgressCount}</div>
              <div style={{ fontSize: '12px', color: '#ea580c' }}>Processing</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#16a34a' }}>{completedCount}</div>
              <div style={{ fontSize: '12px', color: '#16a34a' }}>Complete</div>
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '4px' }}>No projects yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Upload a novel to get started</p>
          </div>
        )}
      </div>
      
      {tasks.length > 0 && (
        <TaskList
          onTaskSelect={onTaskSelect}
          selectedTaskId={selectedTask?.id}
        />
      )}
    </div>
  );
};