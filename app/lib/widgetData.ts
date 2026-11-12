import I18n from '../I18n';
import type {NextPrayerProps, PrayerActivityProps} from '../widgets/types';
import {addDays, formatTime, periodAt, toDayTimes} from './prayerDay';
import {prayerTimesFor} from './prayerTimes';

/** iOS widgets follow a timeline this long without the app running. */
export const TIMELINE_DAYS = 2;
/** The Live Activity shows in the last hour before a prayer. */
export const ACTIVITY_LEAD_MS = 60 * 60 * 1000;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** What the widget shows at `at`: the next prayer then, and that day's times. */
export const nextPrayerProps = (settings: Settings, at: Date): NextPrayerProps => {
  const day = startOfDay(at);
  const [yesterday, today, tomorrow] = [-1, 0, 1].map(i =>
    prayerTimesFor(settings, addDays(day, i)),
  );
  const info = periodAt(at, toDayTimes(yesterday), toDayTimes(today), toDayTimes(tomorrow));
  // Its own label, so Friday's Dhuhr reads "Jumu’ah".
  const label = (key: PrayerKey, time: Date): string =>
    [...today, ...tomorrow].find(p => p.key === key && p.time.getTime() === time.getTime())
      ?.label ?? I18n.t(`prayer.${key}`);
  return {
    city: settings.city?.split(',')[0] ?? I18n.t('settings.unknownCity'),
    heading: I18n.t('widget.next'),
    next: label(info.next.key, info.next.time),
    time: formatTime(info.next.time, settings.timeFormat),
    at: info.next.time.getTime(),
    // After Isha the next prayer is tomorrow's Fajr: show tomorrow's times then.
    prayers: (info.next.time > today[today.length - 1].time ? tomorrow : today).map(p => ({
      name: p.label,
      time: formatTime(p.time, settings.timeFormat),
      current: p.key === info.current,
      next: p.key === info.next.key && info.next.time.getTime() === p.time.getTime(),
    })),
  };
};

/**
 * Timeline entries for the next two days: one now, then one at every prayer time, so the
 * widget moves on to the next prayer by itself.
 */
export const widgetTimeline = (settings: Settings, now: Date = new Date()) => {
  const base = startOfDay(now);
  const changes = Array.from({length: TIMELINE_DAYS + 1}, (_, i) =>
    prayerTimesFor(settings, addDays(base, i)),
  )
    .flat()
    .map(p => p.time)
    .filter(t => t > now)
    .sort((a, b) => a.getTime() - b.getTime());
  return [now, ...changes].map(date => ({date, props: nextPrayerProps(settings, date)}));
};

/** The Live Activity for the next prayer, if it's within the hour; otherwise null. */
export const activityFor = (settings: Settings, now: Date = new Date()): PrayerActivityProps | null => {
  const props = nextPrayerProps(settings, now);
  if (props.at - now.getTime() > ACTIVITY_LEAD_MS) {
    return null;
  }
  return {
    next: props.next,
    time: props.time,
    inLabel: I18n.t('today.in', {label: props.next}),
    city: props.city,
    at: props.at,
  };
};
