import React from 'react';
import { Clock, X, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

export type AlertCardVariant = 'warning' | 'danger' | 'info';

export interface FtAlertCardProps {
  variant: AlertCardVariant;
  rank: number;
  iconType: 'amber-clock' | 'red-x' | 'blue-trend';
  title: string;
  impact: string;
  suggestedAction?: string;
  actionDone?: boolean;
  isSelected?: boolean;
  onAction?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
}

/**
 * ft-alert-card: Reusable Design System Component
 * Features:
 * - 8px rounded corners, 8px grid spacing, calm dark theme
 * - Amber clock, Red X, Blue trend icon variants
 * - Clear impact callout
 * - Actionable button with suggested action
 * - Focus state & keyboard accessible
 */
export const FtAlertCard: React.FC<FtAlertCardProps> = ({
  variant,
  rank,
  iconType,
  title,
  impact,
  suggestedAction,
  actionDone = false,
  isSelected = false,
  onAction,
  onClick,
  className = '',
}) => {
  const variantConfig = {
    warning: {
      border: isSelected ? 'border-[#F0A030]' : 'border-[#243444] hover:border-[#F0A030]/60',
      badgeBg: 'bg-[#F0A030]/15 text-[#F0A030] border-[#F0A030]/30',
      icon: <Clock size={16} strokeWidth={2.2} className="text-[#F0A030]" aria-hidden="true" />,
      btn: 'bg-[#F0A030]/15 text-[#F0A030] hover:bg-[#F0A030]/25 border-[#F0A030]/40',
      rankBadge: 'bg-[#F0A030]/20 text-[#F0A030]',
      highlightBar: 'bg-[#F0A030]',
    },
    danger: {
      border: isSelected ? 'border-[#F25555]' : 'border-[#243444] hover:border-[#F25555]/60',
      badgeBg: 'bg-[#F25555]/15 text-[#F25555] border-[#F25555]/30',
      icon: <X size={16} strokeWidth={2.5} className="text-[#F25555]" aria-hidden="true" />,
      btn: 'bg-[#F25555]/15 text-[#F25555] hover:bg-[#F25555]/25 border-[#F25555]/40',
      rankBadge: 'bg-[#F25555]/20 text-[#F25555]',
      highlightBar: 'bg-[#F25555]',
    },
    info: {
      border: isSelected ? 'border-[#4DA3FF]' : 'border-[#243444] hover:border-[#4DA3FF]/60',
      badgeBg: 'bg-[#4DA3FF]/15 text-[#4DA3FF] border-[#4DA3FF]/30',
      icon: <TrendingUp size={16} strokeWidth={2.2} className="text-[#4DA3FF]" aria-hidden="true" />,
      btn: 'bg-[#4DA3FF]/15 text-[#4DA3FF] hover:bg-[#4DA3FF]/25 border-[#4DA3FF]/40',
      rankBadge: 'bg-[#4DA3FF]/20 text-[#4DA3FF]',
      highlightBar: 'bg-[#4DA3FF]',
    },
  }[variant];

  return (
    <div
      data-component="ft-alert-card"
      data-variant={variant}
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 rounded-[8px] bg-[#16202A] border transition-all duration-150 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF] shadow-sm ${variantConfig.border} ${isSelected ? 'ring-1 ring-[#4DA3FF]/50 bg-[#1C2836]' : ''} ${className}`}
    >
      {/* Top Header: Rank & Icon & Title */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-[4px] flex items-center justify-center text-[11px] font-bold font-mono ${variantConfig.rankBadge}`}
              title={`Prioriteetti #${rank}`}
            >
              #{rank}
            </span>
            <div className={`p-1 rounded-[6px] border ${variantConfig.badgeBg}`}>
              {variantConfig.icon}
            </div>
            <h3 className="text-sm font-semibold text-[#F2F5F7] tracking-tight truncate">
              {title}
            </h3>
          </div>
        </div>

        {/* Impact Description */}
        <p className="text-[13px] text-[#9BA9B8] leading-snug pl-7 mb-3 font-normal">
          {impact}
        </p>
      </div>

      {/* Suggested Action Button (if present) */}
      {suggestedAction && (
        <div className="pt-2 border-t border-[#243444]/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(e);
            }}
            className={`w-full text-xs font-medium py-1.5 px-3 rounded-[6px] border flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF] ${
              actionDone
                ? 'bg-[#3FB950]/20 text-[#3FB950] border-[#3FB950]/40'
                : variantConfig.btn
            }`}
          >
            {actionDone ? (
              <>
                <CheckCircle2 size={13} className="text-[#3FB950]" />
                <span>Toimenpide aktivoitu</span>
              </>
            ) : (
              <>
                <span>{suggestedAction}</span>
                <ArrowRight size={12} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
