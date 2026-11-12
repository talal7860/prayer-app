import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan';
import I18n from '../I18n';
import {PRAYER_KEYS} from './prayerDay';

type Method = Settings['calculationMethod'];

// The saved setting keeps the old PrayTimes keys, so existing installs carry over.
const METHODS: Record<Method, {name: string; params: () => CalculationParameters}> = {
  MWL: {name: 'Muslim World League', params: CalculationMethod.MuslimWorldLeague},
  ISNA: {name: 'Islamic Society of North America (ISNA)', params: CalculationMethod.NorthAmerica},
  Egypt: {name: 'Egyptian General Authority of Survey', params: CalculationMethod.Egyptian},
  Makkah: {name: 'Umm Al-Qura University, Makkah', params: CalculationMethod.UmmAlQura},
  Karachi: {name: 'University of Islamic Sciences, Karachi', params: CalculationMethod.Karachi},
  Tehran: {name: 'Institute of Geophysics, University of Tehran', params: CalculationMethod.Tehran},
  // adhan has no preset for Qum: Fajr 16°, Isha 14°, Maghrib 4° below the horizon.
  Jafari: {
    name: 'Shia Ithna-Ashari, Leva Institute, Qum',
    params: () => {
      const p = CalculationMethod.Other();
      p.fajrAngle = 16;
      p.ishaAngle = 14;
      p.maghribAngle = 4;
      return p;
    },
  },
};

export const METHOD_KEYS = Object.keys(METHODS) as Method[];

const HIGH_LATS: Record<HighLatRule, (typeof HighLatitudeRule)[keyof typeof HighLatitudeRule]> = {
  NightMiddle: HighLatitudeRule.MiddleOfTheNight,
  AngleBased: HighLatitudeRule.TwilightAngle,
  OneSeventh: HighLatitudeRule.SeventhOfTheNight,
};

/** The method for a saved key. A value saved by another version may not be one of ours. */
const methodFor = (method: Method) =>
  Object.hasOwn(METHODS, method) ? METHODS[method] : undefined;

/** The method's display name, e.g. "University of Islamic Sciences, Karachi". */
export const methodName = (method: Method): string => methodFor(method)?.name ?? method;

type Calc = Pick<Settings, 'calculationMethod' | 'asr' | 'location'> &
  Partial<Pick<Settings, 'highLats' | 'adjustments'>>;

const paramsFor = (settings: Calc) => {
  const params = (methodFor(settings.calculationMethod) ?? METHODS.MWL).params();
  params.madhab = settings.asr === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HIGH_LATS[settings.highLats ?? 'NightMiddle'];
  // Where the sun doesn't set or rise at all, use the nearest latitude where it does.
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  // Minutes to match the local mosque (on top of the method's own adjustments).
  PRAYER_KEYS.forEach(key => {
    params.adjustments[key] = settings.adjustments?.[key] ?? 0;
  });
  return params;
};

/**
 * That date's prayer times for these settings (the `adhan` library). No React, so the
 * background task can use it. Times are real instants: a far-north Isha after midnight is
 * already on the next calendar day.
 */
export const prayerTimesFor = (settings: Calc, date: Date = new Date()): PrayerTimeLabel[] => {
  const times = new PrayerTimes(
    new Coordinates(settings.location.lat, settings.location.lng),
    date,
    paramsFor(settings),
  );
  return PRAYER_KEYS.map(prayer => {
    const time = times[prayer];
    const label =
      prayer === 'dhuhr' && time.getDay() === 5
        ? I18n.t('prayer.jumuah')
        : I18n.t(`prayer.${prayer}`);
    return {key: prayer, label, time};
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
