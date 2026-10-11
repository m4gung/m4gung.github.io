import React from 'react';
import { cn } from '../../services/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const variants = {
    primary: 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 focus:ring-neutral-500',
    secondary: 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100 focus:ring-neutral-400',
    outline: 'bg-transparent hover:bg-neutral-800 text-neutral-200 border border-neutral-700 focus:ring-neutral-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    gold: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold shadow-md shadow-amber-900/20 focus:ring-amber-400'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
