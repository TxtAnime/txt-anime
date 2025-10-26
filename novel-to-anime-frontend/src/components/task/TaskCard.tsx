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
          barColor: 'linear-gradient(90deg, #f59e0b, #ea580c)',
          bgColor: '#fef3c7',
          textColor: '#92400e',
          borderColor: '#fde68a',
          icon: (
            <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px', color: '#d97706' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          label: 'Processing'
        };
      case 'done':
        return {
          barColor: 'linear-gradient(90deg, #10b981, #059669)',
          bgColor: '#d1fae5',
          textColor: '#065f46',
          borderColor: '#a7f3d0',
          icon: (
            <svg style={{ width: '16px', height: '16px', color: '#059669' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Complete'
        };
      default:
        return {
          barColor: 'linear-gradient(90deg, #9ca3af, #6b7280)',
          bgColor: '#f9fafb',
          textColor: '#4b5563',
          borderColor: '#e5e7eb',
          icon: (
            <svg style={{ width: '16px', height: '16px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        cursor: 'pointer',
        border: `2px solid ${isSelected ? '#60a5fa' : '#e5e7eb'}`,
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 4px 12px rgba(96, 165, 250, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '12px'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#93c5fd';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {/* Status indicator bar */}
      <div style={{
        height: '4px',
        width: '100%',
        background: statusConfig.barColor,
        borderRadius: '12px 12px 0 0'
      }}></div>
      
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#111827', 
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {task.name || `Project ${task.id.substring(0, 8)}`}
            </h4>
          </div>
          
          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            backgroundColor: statusConfig.bgColor,
            border: `1px solid ${statusConfig.borderColor}`
          }}>
            {statusConfig.icon}
            <span style={{ fontSize: '12px', fontWeight: '500', color: statusConfig.textColor }}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        
        {/* Progress section for processing tasks */}
        {task.status === 'doing' && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#4b5563' }}>
                {task.statusDesc || 'Generation in progress'}
              </span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '6px' }}>
              <div style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', 
                borderRadius: '9999px',
                width: '60%'
              }}></div>
            </div>
          </div>
        )}

        {/* Action section for completed tasks */}
        {task.status === 'done' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingTop: '8px', 
            borderTop: '1px solid #f3f4f6',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#34d399', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '12px', color: '#065f46', fontWeight: '500' }}>
                {task.statusDesc || 'Ready to view'}
              </span>
            </div>
            <svg style={{ width: '16px', height: '16px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};