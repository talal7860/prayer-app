import I18n from '../I18n';
import {formatTime} from './prayerDay';

export const HEADS_UP_MINUTES = 10;
/** iOS keeps at most 64 pending local notifications per app and drops the rest. */
export const MAX_PENDING = 64;
/** How far ahead to plan before trimming to MAX_PENDING. */
export const DAYS_AHEAD = 14;

export type PlannedNotification = {
  /** `reminder`: "open the app", fires after the last planned prayer. */
  kind: 'adhan' | 'headsUp' | 'reminder';
  prayer?: PrayerKey;
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
    // Sunrise isn't a prayer: it's shown on Today's sun arc, with no bell and no notification.
    if (muted[p.key] || p.key === 'sunrise') {
      return;
    }
    const time = formatTime(p.time, timeFormat);
    if (headsUp) {
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

/**
 * As many prayer notifications as fit under MAX_PENDING, then one reminder to open the app,
 * set just after the last of them. The app and the background task push it further out
 * each time they reschedule, so it only fires if neither has run for that long.
 */
export const fillSchedule = (
  days: PrayerTimeLabel[][],
  options: Options,
  now: Date = new Date(),
): PlannedNotification[] => {
  const plan = planNotifications(days, options, now).slice(0, MAX_PENDING - 1);
  const last = plan[plan.length - 1];
  if (!last) {
    return plan;
  }
  return plan.concat({
    kind: 'reminder',
    date: new Date(last.date.getTime() + 60000),
    title: I18n.t('notification.reminder'),
  });
};
