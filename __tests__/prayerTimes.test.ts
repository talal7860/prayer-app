import {METHOD_KEYS, methodName, prayerTimesFor} from '../app/lib/prayerTimes';

const calgary = {lat: 51.05, lng: -114.07};
const at = (list: PrayerTimeLabel[], key: PrayerKey) => list.find(p => p.key === key)!.time;
const gap = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60000;

it.each(METHOD_KEYS)('%s gives six times in order, with a name', method => {
  const t = prayerTimesFor({calculationMethod: method, asr: 'Standard', location: calgary}, new Date(2026, 2, 10, 12));
  expect(t.map(p => p.key)).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  t.forEach(p => expect(Number.isNaN(p.time.getTime())).toBe(false));
  t.slice(1).forEach((p, i) => expect(p.time.getTime()).toBeGreaterThan(t[i].time.getTime()));
  expect(methodName(method)).not.toBe(method);
});

it('takes Fajr and Isha from the method angles, not 90 minutes around sunrise and maghrib', () => {
  const t = prayerTimesFor({calculationMethod: 'Karachi', asr: 'Hanafi', location: calgary}, new Date(2026, 10, 11, 12));
  expect(gap(at(t, 'fajr'), at(t, 'sunrise'))).toBeGreaterThan(90);
  expect(gap(at(t, 'maghrib'), at(t, 'isha'))).toBeGreaterThan(90);
});

it('Hanafi Asr is later than standard Asr', () => {
  const base = {calculationMethod: 'MWL' as const, location: calgary};
  const date = new Date(2026, 5, 1, 12);
  expect(at(prayerTimesFor({...base, asr: 'Hanafi'}, date), 'asr').getTime()).toBeGreaterThan(
    at(prayerTimesFor({...base, asr: 'Standard'}, date), 'asr').getTime(),
  );
});

it('gives valid times inside the Arctic circle in midsummer', () => {
  const tromso = {lat: 69.65, lng: 18.96};
  const t = prayerTimesFor({calculationMethod: 'MWL', asr: 'Standard', location: tromso}, new Date(2026, 5, 21, 12));
  t.forEach(p => expect(Number.isNaN(p.time.getTime())).toBe(false));
});

it('labels Friday’s Dhuhr Jumu’ah', () => {
  const friday = prayerTimesFor({calculationMethod: 'ISNA', asr: 'Standard', location: calgary}, new Date(2026, 2, 13, 12));
  expect(friday.find(p => p.key === 'dhuhr')!.label).toBe('Jumu’ah');
});
