import PrayerTimes from './PrayTimes';
import I18n from '../I18n';
import {PRAYER_KEYS} from './prayerDay';

//@ts-ignore -- vendored JS class
const PT = new PrayerTimes('Karachi');

/** The method's display name, e.g. "University of Islamic Sciences, Karachi". */
export const methodName = (method: Settings['calculationMethod']): string =>
  PT.getDefaults()[method].name;

/** That date's prayer times for these settings. No React, so the background task can use it. */
export const prayerTimesFor = (
  settings: Pick<Settings, 'calculationMethod' | 'asr' | 'location'> &
    Partial<Pick<Settings, 'highLats' | 'adjustments'>>,
  date: Date = new Date(),
): PrayerTimeLabel[] => {
  // Reset to the method's own parameters, then apply the user's choices.
  PT.setMethod(settings.calculationMethod);
  PT.adjust({asr: settings.asr, highLats: settings.highLats ?? 'NightMiddle'});
  // Minutes to match the local mosque. tune() merges, so set every prayer each time.
  PT.tune(Object.fromEntries(PRAYER_KEYS.map(k => [k, settings.adjustments?.[k] ?? 0])));
  const times = PT.getTimes(
    date,
    [settings.location.lat, settings.location.lng],
    -date.getTimezoneOffset() / 60,
    0,
    '24h',
  );
  const dhuhr = Number(times.dhuhr.split(':')[0]);
  return PRAYER_KEYS.map(prayer => {
    const prayerDate = new Date(date);
    const [hours, minutes] = times[prayer].split(':').map(Number);
    prayerDate.setHours(hours, minutes, 0, 0);
    // Far north in summer Isha can fall after midnight ("01:38"). It's still this
    // evening's Isha, so it belongs to the next calendar day, not this morning.
    if ((prayer === 'maghrib' || prayer === 'isha') && hours < dhuhr) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    const label =
      prayer === 'dhuhr' && prayerDate.getDay() === 5
        ? I18n.t('prayer.jumuah')
        : I18n.t(`prayer.${prayer}`);
    return {key: prayer, label, time: prayerDate};
  });
};

/** The largest gap, in whole minutes, between the same prayer in two days' times. */
export const minutesApart = (a: PrayerTimeLabel[], b: PrayerTimeLabel[]): number =>
  Math.max(
    0,
    ...a.map(p => {
      const other = b.find(q => q.key === p.key);
      return other ? Math.round(Math.abs(p.time.getTime() - other.time.getTime()) / 60000) : 0;
    }),
  );
