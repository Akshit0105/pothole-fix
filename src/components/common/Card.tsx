import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'lg',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const variantStyles = {
    elevated:
      'bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_1px_3px_rgba(23,33,38,0.03),0_4px_12px_rgba(23,33,38,0.02)]',
    flat:
      'bg-surface-container-low border border-outline-variant/20 rounded-xl',
    interactive:
      'bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_1px_3px_rgba(23,33,38,0.03),0_4px_12px_rgba(23,33,38,0.02)] hover:border-primary-container hover:shadow-[0_2px_8px_rgba(23,33,38,0.05),0_12px_28px_rgba(8,127,140,0.06)] transition-all duration-200 cursor-pointer',
  };

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
