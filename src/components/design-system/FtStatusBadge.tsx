import React from 'react';
import { Check, Clock, X, AlertTriangle, Info, TrendingUp } from 'lucide-react';

export type StatusBadgeVariant = 'ok' | 'warning' | 'danger' | 'info';

export interface FtStatusBadgeProps {
  variant?: StatusBadgeVariant;
  text?: string;
  delayMinutes?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * ft-status-badge: Reusable Design System Component
 * Rule: Always pairs an explicit icon with legible text, NEVER color alone (WCAG 2.2 AA).
 */
export const FtStatusBadge: React.FC<FtStatusBadgeProps> = ({
  variant = 'ok',
  text,
  delayMinutes,
  size = 'md',
  className = '',
}) => {
  let computedVariant = variant;
  let label = text;

  if (delayMinutes !== undefined) {
    if (delayMinutes <= 0) {
      computedVariant = 'ok';
      label = label || 'Ajallaan';
    } else if (delayMinutes < 15) {
      computedVariant = 'warning';
      label = label || `+${delayMinutes} min`;
    } else {
      computedVariant = 'danger';
      label = label || `+${delayMinutes} min`;
    }
  }

  // Variant styling with tokens: ok (#3FB950), warning (#F0A030), danger (#F25555), info (#4DA3FF)
  const variantStyles = {
    ok: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
    warning: 'bg-[#F0A030]/15 text-[#F0A030] border-[#F0A030]/40',
    danger: 'bg-[#F25555]/15 text-[#FF8080] border-[#F25555]/40',
    info: 'bg-[#4DA3FF]/15 text-[#80BDFF] border-[#4DA3FF]/40',
  }[computedVariant];

  const sizeStyles = {
    sm: 'text-xs py-0.5 px-2 gap-1 rounded-[6px]',
    md: 'text-xs py-1 px-2.5 gap-1.5 rounded-[8px]',
  }[size];

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (computedVariant) {
      case 'ok':
        return <Check size={iconSize} strokeWidth={2.5} aria-hidden="true" />;
      case 'warning':
        return <Clock size={iconSize} strokeWidth={2.2} aria-hidden="true" />;
      case 'danger':
        return <X size={iconSize} strokeWidth={2.5} aria-hidden="true" />;
      case 'info':
        return <TrendingUp size={iconSize} strokeWidth={2.2} aria-hidden="true" />;
    }
  };

  return (
    <span
      data-component="ft-status-badge"
      data-variant={computedVariant}
      className={`inline-flex items-center font-medium font-mono tabular-nums border shrink-0 select-none ${variantStyles} ${sizeStyles} ${className}`}
      role="status"
    >
      {renderIcon()}
      <span>{label}</span>
    </span>
  );
};
