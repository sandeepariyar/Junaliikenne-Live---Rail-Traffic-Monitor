import React, { useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface FtTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * ft-tabs: Reusable Design System Component
 * Accessible tabs with high-contrast visible keyboard focus ring (WCAG 2.2 AA compliant).
 */
export const FtTabs: React.FC<FtTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = '',
  size = 'md',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      onChange(tabs[nextIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Junaliikenteen tilanne välilehdet"
      data-component="ft-tabs"
      className={`flex items-center gap-1 border-b border-[#243444] ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF] focus-visible:rounded-[4px] ${
              isActive
                ? 'text-[#F2F5F7] font-semibold'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-[#4DA3FF]/20 text-[#4DA3FF]'
                    : 'bg-[#243444] text-[#9BA9B8]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {/* Active Indicator Bar */}
            {isActive && (
              <div
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#4DA3FF] rounded-t-full shadow-[0_-1px_6px_rgba(77,163,255,0.6)]"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
