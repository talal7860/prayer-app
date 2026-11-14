import I18n from '../I18n';
import type {NextPrayerProps, PrayerActivityProps} from '../widgets/types';
import {addDays, formatTime, hijriLabel, hijriShort, periodAt, toDayTimes} from './prayerDay';
import type {Period} from '../theme/tokens';
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

/** Sky gradients per period, from the design's Widgets board. */
export const WIDGET_SKIES: Record<Period, [string, string]> = {
  fajr: ['#161D45', '#7A5683'],
  morning: ['#1E4B86', '#7A6E9C'],
  dhuhr: ['#164A8A', '#3271B0'],
  asr: ['#1C4872', '#85602D'],
  maghrib: ['#281C4C', '#A8432C'],
  isha: ['#060A1C', '#1B2650'],
};

/** The five prayers. Sunrise is on the arc as the sun, not in the lists. */
const LISTED: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const SHORT: Record<PrayerKey, string> = {
  fajr: 'week.fajr',
  sunrise: 'week.rise',
  dhuhr: 'week.dhuhr',
  asr: 'week.asr',
  maghrib: 'week.magh',
  isha: 'week.isha',
};

/** What the widgets show at `at`: the next prayer then, its day's times, the sky and sun. */
export const nextPrayerProps = (settings: Settings, at: Date): NextPrayerProps => {
  const day = startOfDay(at);
  const [yesterday, today, tomorrow] = [-1, 0, 1].map(i =>
    prayerTimesFor(settings, addDays(day, i)),
  );
  const info = periodAt(at, toDayTimes(yesterday), toDayTimes(today), toDayTimes(tomorrow));
  const all = [...yesterday, ...today, ...tomorrow];
  const t = at.getTime();
  const nextAt = info.next.time.getTime();
  // The progress bars and rings run from the last prayer time to the next one.
  const earlier = all.map(p => p.time.getTime()).filter(ms => ms <= t);
  const prevAt = earlier.length ? Math.max(...earlier) : t - 3600000;
  // Its own label, so Friday's Dhuhr reads "Jumu’ah".
  const next: string =
    all.find(p => p.key === info.next.key && p.time.getTime() === nextAt)?.label ??
    String(I18n.t(`prayer.${info.next.key}`));
  const time = formatTime(info.next.time, settings.timeFormat);
  // During Fajr the countdown is to sunrise, which is when Fajr's time ends.
  const fajrEnding = info.period === 'fajr' && info.next.key === 'sunrise';
  const fajr = today.find(p => p.key === 'fajr')?.label ?? String(I18n.t('prayer.fajr'));
  const fmt = (d: Date) => formatTime(d, settings.timeFormat);

  // The current prayer day: before Fajr it's still yesterday's (its Isha is the prayer now).
  // The arc and the list both show it.
  const prayerDay = t < toDayTimes(today).fajr.getTime() ? yesterday : today;
  const arc = toDayTimes(prayerDay);
  const span = arc.isha.getTime() - arc.fajr.getTime();
  const along = (d: Date) => Math.min(1, Math.max(0, (d.getTime() - arc.fajr.getTime()) / span));
  const sunUp = t >= arc.sunrise.getTime() && t <= arc.maghrib.getTime();

  // Filled = the prayer whose time it is now (none between sunrise and Dhuhr). From Isha until
  // Fajr that's Isha, so the list stays on Isha's day, as on Today, and the next Fajr (another
  // day) isn't in it: the countdown names it.
  const current = info.current ?? (info.period === 'isha' ? 'isha' : null);
  const isNext = (p: PrayerTimeLabel) => p.key === info.next.key && p.time.getTime() === nextAt;
  const isNow = (p: PrayerTimeLabel) => p.key === current;

  return {
    city: settings.city?.split(',')[0] ?? I18n.t('settings.unknownCity'),
    cityFull: settings.city ?? I18n.t('settings.unknownCity'),
    hijri: hijriLabel(at),
    hijriShort: hijriShort(at),
    next,
    nextShort: next.slice(0, 3).toLocaleUpperCase(I18n.locale),
    time,
    inLabel: fajrEnding ? I18n.t('today.endsIn', {label: fajr}) : I18n.t('today.in', {label: next}),
    atLabel: I18n.t('widget.at', {time}),
    untilLabel: fajrEnding
      ? I18n.t('widget.untilEnd', {label: fajr, time})
      : I18n.t('widget.until', {label: next, time}),
    nextTag: I18n.t('today.next'),
    nowTag: I18n.t('today.now'),
    at: nextAt,
    prevAt,
    sky: WIDGET_SKIES[info.period],
    sunT: sunUp ? along(at) : -1,
    marks: LISTED.map(key => {
      const d = arc[key];
      const nxt = key === info.next.key && d.getTime() === nextAt;
      return {t: along(d), next: nxt, past: !nxt && d.getTime() <= t};
    }),
    prayers: prayerDay
      .filter(p => LISTED.includes(p.key))
      .map(p => ({
        name: p.label,
        label:
          p.key === 'dhuhr' && p.label !== I18n.t('prayer.dhuhr') ? p.label : I18n.t(SHORT[p.key]),
        time: fmt(p.time),
        hm: formatTime(p.time, settings.timeFormat, false),
        now: isNow(p),
        next: isNext(p),
        past: !isNext(p) && !isNow(p) && p.time.getTime() <= t,
      })),
  };
};

/**
 * Timeline entries for the next two days: one now, then one at every prayer time, so the
 * widget moves on to the next prayer by itself.
 */
export const widgetTimeline = (settings: Settings, now: Date = new Date()) => {
  const base = startOfDay(now);
  const end = addDays(base, TIMELINE_DAYS + 1).getTime();
  const prayers = Array.from({length: TIMELINE_DAYS + 1}, (_, i) =>
    prayerTimesFor(settings, addDays(base, i)),
  )
    .flat()
    .map(p => p.time.getTime());
  // Every half hour too, so the sun moves along the arc between prayers.
  const ticks: number[] = [];
  for (let ms = Math.ceil(now.getTime() / 1800000) * 1800000; ms < end; ms += 1800000) {
    ticks.push(ms);
  }
  const dates = [...new Set([...prayers, ...ticks])]
    .filter(ms => ms > now.getTime() && ms < end)
    .sort((a, b) => a - b)
    .map(ms => new Date(ms));
  return [now, ...dates].map(date => ({date, props: nextPrayerProps(settings, date)}));
};

/**
 * Android's snapshot: the props for now, plus an entry from every prayer time in the next two
 * days, so the widget can move on by itself (see `NextPrayerProps.entries`).
 */
export const androidWidgetProps = (settings: Settings, now: Date = new Date()): NextPrayerProps => {
  const base = startOfDay(now);
  const end = addDays(base, TIMELINE_DAYS + 1).getTime();
  const times = Array.from({length: TIMELINE_DAYS + 1}, (_, i) =>
    prayerTimesFor(settings, addDays(base, i)),
  )
    .flat()
    .map(p => p.time.getTime())
    .filter(ms => ms > now.getTime() && ms < end)
    .sort((a, b) => a - b);
  return {
    ...nextPrayerProps(settings, now),
    entries: times.map(ms => ({from: ms, props: nextPrayerProps(settings, new Date(ms))})),
  };
};

/**
 * The Live Activity for the next prayer, if it's within the hour and the setting is on;
 * otherwise null (and `syncLiveActivity` ends any running one).
 */
export const activityFor = (
  settings: Settings,
  now: Date = new Date(),
): PrayerActivityProps | null => {
  if (!settings.liveActivity) {
    return null;
  }
  const props = nextPrayerProps(settings, now);
  if (props.at - now.getTime() > ACTIVITY_LEAD_MS) {
    return null;
  }
  return {
    next: props.next,
    time: props.time,
    inLabel: props.inLabel,
    city: props.city,
    at: props.at,
  };
};
