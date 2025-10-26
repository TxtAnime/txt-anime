import { useState, useRef, useEffect } from 'react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isSelected?: boolean;
}

export const TaskCard = ({ task, onSelect, onDelete, isSelected = false }: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
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
            marginTop: '8px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#34d399', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '12px', color: '#065f46', fontWeight: '500' }}>
                {task.statusDesc || 'Ready to view'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              
              {/* Menu button positioned at bottom right */}
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  className="menu-trigger interactive button-press"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  title="More options"
                >
                  <svg style={{ width: '12px', height: '12px', color: '#6b7280' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div 
                    className="menu-dropdown shadow-menu"
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: '0',
                      marginBottom: '4px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      minWidth: '120px',
                      zIndex: 50,
                      overflow: 'hidden'
                    }}>
                    {/* Delete option */}
                    {onDelete && (
                      <button
                        className="menu-item menu-item-danger interactive button-press"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete(task);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#ef4444'
                        }}
                      >
                        <svg style={{ width: '14px', height: '14px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menu button for processing tasks - positioned at bottom right */}
        {task.status === 'doing' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className="menu-trigger interactive button-press"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                title="More options"
              >
                <svg style={{ width: '12px', height: '12px', color: '#6b7280' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div 
                  className="menu-dropdown shadow-menu"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: '0',
                    marginBottom: '4px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    minWidth: '120px',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}>
                  {/* Delete option */}
                  {onDelete && (
                    <button
                      className="menu-item menu-item-danger interactive button-press"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(task);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ef4444'
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};