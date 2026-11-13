// Pure helpers for the Today and Week screens. No React, no I/O, so they're easy to test.
import type {Period} from '../theme/tokens';
import I18n, {latinDigits} from '../I18n';

export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type DayTimes = Record<PrayerKey, Date>;

export const toDayTimes = (list: PrayerTimeLabel[]): DayTimes =>
  list.reduce((acc, p) => ({...acc, [p.key]: p.time}), {} as DayTimes);

const pad = (n: number) => `${n}`.padStart(2, '0');

/** "7:16 AM" / "19:24". `withPeriod: false` drops AM/PM (the Week table). */
export const formatTime = (time: Date, format: TimeFormat = '12h', withPeriod = true): string => {
  const h = time.getHours();
  const m = pad(time.getMinutes());
  if (format === '24h') {
    return `${pad(h)}:${m}`;
  }
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return withPeriod ? `${h12}:${m} ${I18n.t(h >= 12 ? 'time.pm' : 'time.am')}` : `${h12}:${m}`;
};

/** "1:02:03" with hours, "02:03" without. */
export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor(total / 60) % 60;
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export type PeriodInfo = {
  period: Period;
  /** The prayer whose time it currently is (null in the morning and before Fajr). */
  current: PrayerKey | null;
  next: {key: PrayerKey; time: Date};
};

/**
 * Which part of the day `now` falls in, and the next prayer.
 * Needs yesterday (for Isha before Fajr) and tomorrow (for Fajr after Isha).
 */
export const periodAt = (
  now: Date,
  yesterday: DayTimes,
  today: DayTimes,
  tomorrow: DayTimes,
): PeriodInfo => {
  const t = now.getTime();
  const bounds: {period: Period; current: PrayerKey | null; s: Date; e: Date}[] = [
    {period: 'isha', current: null, s: yesterday.isha, e: today.fajr},
    {period: 'fajr', current: 'fajr', s: today.fajr, e: today.sunrise},
    {period: 'morning', current: null, s: today.sunrise, e: today.dhuhr},
    {period: 'dhuhr', current: 'dhuhr', s: today.dhuhr, e: today.asr},
    {period: 'asr', current: 'asr', s: today.asr, e: today.maghrib},
    {period: 'maghrib', current: 'maghrib', s: today.maghrib, e: today.isha},
    {period: 'isha', current: 'isha', s: today.isha, e: tomorrow.fajr},
  ];
  const found = bounds.find(b => t >= b.s.getTime() && t < b.e.getTime()) ?? bounds[6];
  const upcoming = PRAYER_KEYS.map(key => ({key, time: today[key]}))
    .concat({key: 'fajr', time: tomorrow.fajr})
    .find(p => p.time.getTime() > t) ?? {key: 'fajr', time: tomorrow.fajr};
  return {period: found.period, current: found.current, next: upcoming};
};

/** The sun's position on the header arc, or null between sunset and sunrise. */
export const sunPosition = (now: Date, today: DayTimes): {x: number; y: number} | null => {
  const start = today.sunrise.getTime();
  const end = today.maghrib.getTime();
  const t = now.getTime();
  if (t < start || t > end) {
    return null;
  }
  const f = (t - start) / (end - start);
  // Quadratic bezier (16,78) -> (171,-30) -> (326,78) on a 342x96 canvas.
  const x = (1 - f) ** 2 * 16 + 2 * (1 - f) * f * 171 + f ** 2 * 326;
  const y = (1 - f) ** 2 * 78 + 2 * (1 - f) * f * -30 + f ** 2 * 78;
  return {x, y};
};

/** Minutes between sunrise and sunset. */
export const daylightMinutes = (day: DayTimes) =>
  (day.maghrib.getTime() - day.sunrise.getTime()) / 60000;

export const isFriday = (date: Date) => date.getDay() === 5;

export const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Tabular (arithmetic) Islamic calendar. Can differ from Umm al-Qura by a day. */
export const tabularHijri = (date: Date) => {
  const jd =
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000) + 2440588;
  const l0 = jd - 1948440 + 10632;
  const n = Math.floor((l0 - 1) / 10631);
  const l1 = l0 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) +
    Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 =
    l1 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l2) / 709);
  const day = l2 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return {day, month, year};
};

/** "Jumada II 1, 1448 AH". Umm al-Qura through Intl when available. */
export const hijriLabel = (date: Date): string => {
  try {
    // A single -u-ca tag: Hermes ignores the `calendar` option and combined extensions.
    const label = latinDigits(
      new Intl.DateTimeFormat(`${I18n.locale}-u-ca-islamic-umalqura`, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
    );
    // Engines without the Islamic calendar silently give the Gregorian date.
    if (/14\d\d|15\d\d/.test(label) && !label.includes(`${date.getFullYear()}`)) {
      return label;
    }
  } catch {
    // Fall through to the arithmetic calendar.
  }
  const h = tabularHijri(date);
  const monthName = I18n.t(`hijri.m${h.month}`);
  return I18n.t('hijri.date', {
    month: monthName,
    day: h.day,
    year: h.year,
  });
};

/** The Hijri day and month without the year: "Jumada II 1", "1 جمادى الآخرة". */
export const hijriShort = (date: Date): string =>
  hijriLabel(date).replace(/[\s,،]*1[45]\d\d.*$/, '');

/** Great-circle distance in km. */
export const distanceKm = (a: GeoLocation, b: GeoLocation) => {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** "51.05° N, 114.09° W" */
export const formatCoords = ({lat, lng}: GeoLocation) =>
  `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(
    2,
  )}° ${lng >= 0 ? 'E' : 'W'}`;

/** 0 at Fajr, 1 at Isha (clamped): where a time sits on the big semicircle arc. */
export const arcFraction = (time: Date, today: DayTimes): number => {
  const span = today.isha.getTime() - today.fajr.getTime();
  if (span <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, (time.getTime() - today.fajr.getTime()) / span));
};

/** A point on the big semicircle arc (iPad and cover layouts), on a 600x300 canvas. */
export const semiArcPoint = (fraction: number): {x: number; y: number} => {
  const a = Math.PI * (1 - fraction);
  return {x: 300 + 280 * Math.cos(a), y: 290 - 270 * Math.sin(a)};
};

export type DaySlot = {
  key: PrayerKey;
  label: string;
  time: Date;
  /** The prayer the countdown is to. */
  isNext: boolean;
  /** Its time has gone by today (and it isn't next). */
  past: boolean;
};

/**
 * All six times for the iPad and cover layouts, which mark the next prayer rather than the current one.
 * After Isha the next one is tomorrow's Fajr, so the Fajr slot shows tomorrow's time.
 */
export const daySlots = (
  list: PrayerTimeLabel[],
  now: Date,
  next: {key: PrayerKey; time: Date},
): DaySlot[] =>
  list.map(p => {
    const isNext = p.key === next.key;
    const time = isNext ? next.time : p.time;
    return {
      key: p.key,
      label: p.label,
      time,
      isNext,
      past: !isNext && p.time.getTime() <= now.getTime(),
    };
  });
