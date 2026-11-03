import React from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import { AlertCardItem, Language } from '../types';
import { FtAlertCard } from './design-system/FtAlertCard';
import { TRANSLATIONS } from '../data/railData';

export interface AttentionNowRowProps {
  alerts: AlertCardItem[];
  selectedAlertId: string | null;
  onSelectAlert: (alert: AlertCardItem) => void;
  onExecuteAction: (alertId: string) => void;
  language: Language;
}

export const AttentionNowRow: React.FC<AttentionNowRowProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onExecuteAction,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <section
      aria-label="Tärkeimmät huomiota vaativat häiriöt"
      className="px-4 py-2 bg-[#0E141B] shrink-0"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F2F5F7] uppercase tracking-wider">
            <AlertTriangle size={15} className="text-[#F0A030]" aria-hidden="true" />
            <span>{t.huomioNyt}</span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[#F25555]/20 border border-[#F25555]/40 text-[#F25555] text-[11px] font-bold font-mono">
            {alerts.length}
          </span>
          <span className="text-xs text-[#9BA9B8] hidden sm:inline">
            · {alerts.length} {t.activeAlerts}
          </span>
        </div>
        <div className="text-[11px] text-[#9BA9B8] font-mono">
          Päivittyy reaaliajassa (Fintraffic Digitraffic API)
        </div>
      </div>

      {/* 3 Ranked Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const title = language === 'fi' ? alert.title : alert.titleEn;
          const impact = language === 'fi' ? alert.impact : alert.impactEn;
          const action = language === 'fi' ? alert.suggestedAction : alert.suggestedActionEn;

          return (
            <FtAlertCard
              key={alert.id}
              variant={alert.variant}
              rank={alert.rank}
              iconType={alert.iconType}
              title={title}
              impact={impact}
              suggestedAction={action}
              actionDone={alert.actionDone}
              isSelected={selectedAlertId === alert.id}
              onClick={() => onSelectAlert(alert)}
              onAction={() => onExecuteAction(alert.id)}
            />
          );
        })}
      </div>
    </section>
  );
};
