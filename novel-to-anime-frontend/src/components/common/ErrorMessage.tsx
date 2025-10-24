import type { ReactNode } from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export const ErrorMessage = ({ 
  title = 'Error', 
  message, 
  action, 
  className = '' 
}: ErrorMessageProps) => {
  return (
    <div className={`bg-gradient-to-r from-red-50 to-red-50/80 border border-red-200 rounded-xl p-6 shadow-soft animate-slide-up ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <svg 
              className="h-5 w-5 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-800 mb-1">{title}</h3>
          <p className="text-sm text-red-700 leading-relaxed">{message}</p>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};