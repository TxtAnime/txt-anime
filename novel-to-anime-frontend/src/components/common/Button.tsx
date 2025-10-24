import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, style, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          };
        case 'secondary':
          return {
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db'
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: '#374151',
            border: 'none'
          };
        case 'danger':
          return {
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none'
          };
        default:
          return {
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none'
          };
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return { padding: '8px 12px', fontSize: '14px' };
        case 'md':
          return { padding: '12px 24px', fontSize: '16px' };
        case 'lg':
          return { padding: '16px 32px', fontSize: '18px' };
        default:
          return { padding: '12px 24px', fontSize: '16px' };
      }
    };

    const isDisabled = disabled || loading;
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const buttonStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '500',
      borderRadius: '8px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      transition: 'all 0.2s ease',
      outline: 'none',
      fontFamily: 'inherit',
      ...variantStyles,
      ...sizeStyles,
      ...style
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={buttonStyle}
        {...props}
      >
        {loading && (
          <svg 
            style={{ 
              animation: 'spin 1s linear infinite', 
              marginLeft: '-4px', 
              marginRight: '8px', 
              width: '16px', 
              height: '16px' 
            }} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              style={{ opacity: 0.25 }} 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              style={{ opacity: 0.75 }} 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';