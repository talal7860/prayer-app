import {minutesApart, prayerTimesFor} from './prayerTimes';

/** Prayer times this far apart (minutes) mean the user should switch location. */
export const TRAVEL_MINUTES = 2;

type Calc = Pick<Settings, 'calculationMethod' | 'asr'> & Partial<Pick<Settings, 'highLats'>>;

/** Whether `here` has prayer times 2+ minutes off `saved`'s, today. */
export const movedEnough = (
  calc: Calc,
  saved: GeoLocation,
  here: GeoLocation,
  date: Date = new Date(),
): boolean =>
  minutesApart(
    prayerTimesFor({...calc, location: saved}, date),
    prayerTimesFor({...calc, location: here}, date),
  ) >= TRAVEL_MINUTES;
