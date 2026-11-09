import React from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import { AlertCardItem, Language } from '../types';
import { FtAlertCard } from './design-system/FtAlertCard';
import { TRANSLATIONS } from '../data/railData';
import { DataState } from '../store/railStore';

export interface AttentionNowRowProps {
  alerts: AlertCardItem[];
  selectedAlertId: string | null;
  onSelectAlert: (alert: AlertCardItem) => void;
  onExecuteAction: (alertId: string) => void;
  language: Language;
  dataState: DataState;
}

export const AttentionNowRow: React.FC<AttentionNowRowProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onExecuteAction,
  language,
  dataState,
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
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[#F25555]/20 border border-[#F25555]/40 text-[#FF8080] text-[11px] font-bold font-mono">
            {alerts.length}
          </span>
          <span className="text-xs text-[#9BA9B8] hidden sm:inline">
            · {alerts.length} {t.activeAlerts}
          </span>
        </div>
        {dataState === 'scenario' ? (
          <div className="text-[11px] font-mono font-semibold text-[#F0A030] px-2 py-0.5 rounded-[4px] border border-dashed border-[#F0A030]/60">
            {language === 'fi' ? 'Koulutusskenaario — ei todellisia toimenpiteitä' : 'Training scenario — no real operations'}
          </div>
        ) : (
          <div className="text-[11px] text-[#B6C2CF] font-mono">
            {language === 'fi' ? 'Live-tila: vain Digitrafficin GPS-sijainnit' : 'Live mode: Digitraffic GPS positions only'}
          </div>
        )}
      </div>

      {dataState !== 'scenario' && (
        <p className="text-xs text-[#B6C2CF] py-2 px-3 rounded-[8px] border border-[#243444] bg-[#16202A]">
          {language === 'fi'
            ? 'Häiriötietolähdettä ei ole kytketty live-tilaan, joten huomiokortteja ei näytetä. Simuloidut häiriöt ja toimenpiteet ovat vain koulutusskenaariossa.'
            : 'No disruption feed is connected in live mode, so no alert cards are shown. Simulated disruptions and actions exist only in the training scenario.'}
        </p>
      )}

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
