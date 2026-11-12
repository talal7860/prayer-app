import I18n from '../I18n';
import {formatTime} from './prayerDay';

export const HEADS_UP_MINUTES = 10;

export type PlannedNotification = {
  kind: 'adhan' | 'headsUp';
  prayer: PrayerKey;
  title: string;
  date: Date;
};

type Options = Pick<Settings, 'muted' | 'headsUp' | 'timeFormat'>;

/** Every notification to schedule for these days, in time order. Past ones are dropped. */
export const planNotifications = (
  days: PrayerTimeLabel[][],
  {muted = {}, headsUp, timeFormat}: Options,
  now: Date = new Date(),
): PlannedNotification[] => {
  const plan: PlannedNotification[] = [];
  days.flat().forEach(p => {
    if (muted[p.key]) {
      return;
    }
    const time = formatTime(p.time, timeFormat);
    if (headsUp && p.key !== 'sunrise') {
      const date = new Date(p.time.getTime() - HEADS_UP_MINUTES * 60000);
      plan.push({
        kind: 'headsUp',
        prayer: p.key,
        date,
        title: I18n.t('notification.headsUp', {label: p.label, time}),
      });
    }
    plan.push({
      kind: 'adhan',
      prayer: p.key,
      date: p.time,
      title: I18n.t('notification.title', {label: p.label, time}),
    });
  });
  return plan
    .filter(n => n.date.getTime() > now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};
