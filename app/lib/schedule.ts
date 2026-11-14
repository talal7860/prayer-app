import I18n from '../I18n';
import {formatTime} from './prayerDay';

/** The "ends soon" reminder comes this long before a prayer's time ends. */
export const ENDS_SOON_MINUTES = 20;
/**
 * When each prayer's time ends: Fajr at sunrise, Dhuhr at Asr, Asr at Maghrib (sunset),
 * Maghrib at Isha, and Isha at the next Fajr.
 */
const ENDS_AT: Partial<Record<PrayerKey, PrayerKey>> = {
  fajr: 'sunrise',
  dhuhr: 'asr',
  asr: 'maghrib',
  maghrib: 'isha',
  isha: 'fajr',
};
/** iOS keeps at most 64 pending local notifications per app and drops the rest. */
export const MAX_PENDING = 64;
/** How far ahead to plan before trimming to MAX_PENDING. */
export const DAYS_AHEAD = 14;

export type PlannedNotification = {
  /** `reminder`: "open the app", fires after the last planned prayer. */
  kind: 'adhan' | 'endsSoon' | 'reminder';
  prayer?: PrayerKey;
  title: string;
  date: Date;
};

type Options = Pick<Settings, 'muted' | 'endsSoon' | 'timeFormat'>;

/** Every notification to schedule for these days, in time order. Past ones are dropped. */
export const planNotifications = (
  days: PrayerTimeLabel[][],
  {muted, endsSoon, timeFormat}: Options,
  now: Date = new Date(),
): PlannedNotification[] => {
  const plan: PlannedNotification[] = [];
  const all = days.flat();
  all.forEach((p, i) => {
    // Sunrise isn't a prayer: it's shown on Today's sun arc, with no bell and no notification.
    if (muted[p.key] || p.key === 'sunrise') {
      return;
    }
    const time = formatTime(p.time, timeFormat);
    // "Fajr ends in 20 minutes": the time that ends it is the next one with that key. The
    // last Isha planned has no next Fajr here, so it gets none.
    const end = endsSoon ? all.slice(i + 1).find(e => e.key === ENDS_AT[p.key]) : undefined;
    if (end) {
      plan.push({
        kind: 'endsSoon',
        prayer: p.key,
        date: new Date(end.time.getTime() - ENDS_SOON_MINUTES * 60000),
        title: I18n.t('notification.endsSoon', {
          label: p.label,
          time: formatTime(end.time, timeFormat),
        }),
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
  const last = plan.at(-1);
  if (!last) {
    return plan;
  }
  return plan.concat({
    kind: 'reminder',
    date: new Date(last.date.getTime() + 60000),
    title: I18n.t('notification.reminder'),
  });
};
