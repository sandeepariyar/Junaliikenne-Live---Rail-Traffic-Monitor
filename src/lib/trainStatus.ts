import { Train, Language } from '../types';
import type { StatusBadgeVariant } from '../components/web-components';

/** Single source of truth for how a train's status is shown (badge variant + text). */
export function trainStatus(train: Train, lang: Language): { variant: StatusBadgeVariant; text: string } {
  const fi = lang === 'fi';
  if (train.status === 'cancelled') return { variant: 'danger', text: fi ? 'Peruttu' : 'Cancelled' };
  if (train.delayMinutes === null || train.delayMinutes === undefined)
    return { variant: 'neutral', text: fi ? 'Viive ei saatavilla' : 'Delay unavailable' };
  if (train.delayMinutes > 0)
    return { variant: train.delayMinutes >= 15 ? 'danger' : 'warning', text: `+${train.delayMinutes} min` };
  return { variant: 'ok', text: fi ? 'Ajallaan' : 'On time' };
}

export const unavailable = (lang: Language) => (lang === 'fi' ? 'Ei saatavilla' : 'Unavailable');
