import {minutesApart, prayerTimesFor} from '../app/lib/prayerTimes';
import {movedEnough} from '../app/lib/travel';

const calc = {calculationMethod: 'ISNA', asr: 'Standard', highLats: 'NightMiddle'} as const;
const calgary = {lat: 51.05, lng: -114.07};
const date = new Date(2026, 2, 10, 12);

it('a few km away is the same prayer times', () => {
  expect(movedEnough(calc, calgary, {lat: 51.08, lng: -114.1}, date)).toBe(false);
});

it('Edmonton is far enough to suggest switching', () => {
  expect(movedEnough(calc, calgary, {lat: 53.55, lng: -113.49}, date)).toBe(true);
});

it('adjustments shift only that prayer, by that many minutes', () => {
  const base = prayerTimesFor({...calc, location: calgary}, date);
  const tuned = prayerTimesFor({...calc, location: calgary, adjustments: {isha: -3, fajr: 2}}, date);
  const gap = (k: PrayerKey) =>
    (tuned.find(p => p.key === k)!.time.getTime() - base.find(p => p.key === k)!.time.getTime()) / 60000;
  expect(gap('fajr')).toBe(2);
  expect(gap('isha')).toBe(-3);
  expect(gap('dhuhr')).toBe(0);
  expect(minutesApart(base, tuned)).toBe(3);
  // The next call without adjustments isn't affected by the last one.
  expect(minutesApart(base, prayerTimesFor({...calc, location: calgary}, date))).toBe(0);
});
