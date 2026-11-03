import React from 'react';

export interface FtTableRowProps {
  isSelected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * ft-table-row: Reusable Design System Component
 * High-density table row with WCAG keyboard support, focus indicators, and subtle hover.
 */
export const FtTableRow: React.FC<FtTableRowProps> = ({
  isSelected = false,
  onClick,
  children,
  className = '',
  ariaLabel,
}) => {
  return (
    <tr
      data-component="ft-table-row"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group transition-colors duration-100 cursor-pointer border-b border-[#243444]/60 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4DA3FF] focus-visible:bg-[#1C2836] ${
        isSelected
          ? 'bg-[#1C2836] text-[#F2F5F7] font-medium'
          : 'hover:bg-[#16202A]/80 text-[#9BA9B8]'
      } ${className}`}
    >
      {children}
    </tr>
  );
};
