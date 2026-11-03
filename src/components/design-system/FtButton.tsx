import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface FtButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * ft-button: Reusable Design System Component
 * Single-line operator controls with 8px rounded corners and high-contrast states.
 */
export const FtButton: React.FC<FtButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const variantStyles = {
    primary: 'bg-[#4DA3FF] text-[#0E141B] font-semibold hover:bg-[#66b1ff] active:bg-[#3d91eb]',
    secondary: 'bg-[#1C2836] text-[#F2F5F7] border border-[#243444] hover:bg-[#223242] hover:border-[#354a5e]',
    subtle: 'bg-transparent text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#16202A] border border-transparent',
    danger: 'bg-[#F25555]/20 text-[#F25555] border border-[#F25555]/40 hover:bg-[#F25555]/30',
    ghost: 'bg-transparent text-[#F2F5F7] hover:bg-[#1C2836]',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs py-1 px-2.5 rounded-[6px] gap-1.5',
    md: 'text-xs py-1.5 px-3 rounded-[8px] gap-2',
    lg: 'text-sm py-2 px-4 rounded-[8px] gap-2.5',
  }[size];

  return (
    <button
      data-component="ft-button"
      data-variant={variant}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF] ${variantStyles} ${sizeStyles} ${className}`}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
