import { Train, DisturbanceReport, Language } from '../types';

export interface ShiftSummary { headline: string; detail: string; punctuality: number }

/**
 * Deterministic, rule-based shift summary computed in the browser.
 * No LLM / API key is used in the frontend. An LLM-generated summary would
 * have to run behind a server-side proxy so that no key is shipped to clients.
 */
export function summarizeShift(trains: Train[], disturbances: DisturbanceReport[], lang: Language): ShiftSummary {
  const running = trains.filter((t) => t.status !== 'cancelled');
  const cancelled = trains.length - running.length;
  const delayed = running.filter((t) => t.delayMinutes >= 3);
  const worst = [...delayed].sort((a, b) => b.delayMinutes - a.delayMinutes)[0];
  const punctuality = trains.length ? Math.round(((running.length - delayed.length) / trains.length) * 1000) / 10 : 100;
  const active = disturbances.filter((d) => d.status !== 'resolving');
  const high = active.filter((d) => d.severity === 'high');

  if (lang === 'fi') {
    const headline = delayed.length === 0 && cancelled === 0
      ? 'Liikenne kulkee aikataulussa.'
      : `${delayed.length} myöhässä, ${cancelled} peruttu${high.length ? `, ${high.length} vakavaa häiriötä` : ''}.`;
    const detail = worst
      ? `Suurin viive: ${worst.number} (${worst.route}) +${worst.delayMinutes} min. Täsmällisyys ${punctuality} %.`
      : `Täsmällisyys ${punctuality} %.`;
    return { headline, detail, punctuality };
  }
  const headline = delayed.length === 0 && cancelled === 0
    ? 'Traffic is running on schedule.'
    : `${delayed.length} delayed, ${cancelled} cancelled${high.length ? `, ${high.length} high-severity disturbances` : ''}.`;
  const detail = worst
    ? `Largest delay: ${worst.number} (${worst.route}) +${worst.delayMinutes} min. Punctuality ${punctuality}%.`
    : `Punctuality ${punctuality}%.`;
  return { headline, detail, punctuality };
}
