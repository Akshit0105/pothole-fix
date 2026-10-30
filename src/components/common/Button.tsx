import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-title-md font-medium rounded-lg transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-label-md gap-1.5',
    md: 'px-4 py-2 text-body-md gap-2',
    lg: 'px-5 py-2.5 text-title-md gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-primary-container text-on-primary hover:bg-primary shadow-sm hover:shadow active:scale-[0.99]',
    secondary:
      'bg-surface-container-lowest text-on-surface border border-outline-variant/40 hover:bg-surface-container-low hover:border-secondary transition-colors',
    outline:
      'bg-transparent text-primary border border-primary/30 hover:bg-primary-fixed/20',
    ghost:
      'bg-transparent text-secondary hover:text-on-surface hover:bg-surface-container-low',
    danger:
      'bg-error text-on-error hover:bg-error/90 shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
    </button>
  );
};
