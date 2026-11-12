import {fillSchedule, MAX_PENDING, planNotifications} from '../app/lib/schedule';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const day = (d: number): PrayerTimeLabel[] => [
  {key: 'fajr', label: 'Fajr', time: at(d, 6, 16)},
  {key: 'sunrise', label: 'Sunrise', time: at(d, 7, 46)},
  {key: 'dhuhr', label: 'Dhuhr', time: at(d, 12, 20)},
  {key: 'asr', label: 'Asr', time: at(d, 15, 6)},
  {key: 'maghrib', label: 'Maghrib', time: at(d, 16, 54)},
  {key: 'isha', label: 'Isha', time: at(d, 18, 24)},
];

it('skips muted prayers and past times', () => {
  const plan = planNotifications(
    [day(11), day(12)],
    {muted: {sunrise: true, asr: true}, headsUp: false, timeFormat: '12h'},
    at(11, 13),
  );
  expect(plan.map(p => `${p.date.getDate()} ${p.prayer}`)).toEqual([
    '11 maghrib',
    '11 isha',
    '12 fajr',
    '12 dhuhr',
    '12 maghrib',
    '12 isha',
  ]);
  expect(plan[0].title).toBe("It's Maghrib time - 4:54 PM");
});

it('adds a heads-up 10 minutes before each prayer, not before sunrise', () => {
  const plan = planNotifications(
    [day(11)],
    {muted: {}, headsUp: true, timeFormat: '24h'},
    at(11, 15, 0),
  );
  expect(plan.map(p => `${p.kind} ${p.prayer}`)).toEqual([
    'adhan asr',
    'headsUp maghrib',
    'adhan maghrib',
    'headsUp isha',
    'adhan isha',
  ]);
  expect(plan[1]).toMatchObject({date: at(11, 16, 44), title: 'Maghrib in 10 minutes - 16:54'});
});

it('stays under the iOS limit of 64 pending notifications for 5 days', () => {
  const days = [11, 12, 13, 14, 15].map(day);
  const plan = planNotifications(days, {muted: {sunrise: true}, headsUp: true, timeFormat: '12h'}, at(11, 0));
  expect(plan.length).toBe(50);
});

describe('fillSchedule', () => {
  const days = Array.from({length: 14}, (_, i) => day(11 + i));

  it('fills the iOS limit and ends with a reminder to open the app', () => {
    const plan = fillSchedule(days, {muted: {sunrise: true}, headsUp: false, timeFormat: '12h'}, at(11, 0));
    expect(plan).toHaveLength(MAX_PENDING);
    // 5 a day: 63 prayers reach Isha's day after 12 full days (12 * 5 = 60, then 3 more).
    const last = plan[MAX_PENDING - 2];
    expect(`${last.date.getDate()} ${last.prayer}`).toBe('23 asr');
    expect(plan[MAX_PENDING - 1]).toMatchObject({
      kind: 'reminder',
      date: new Date(last.date.getTime() + 60000),
      title: 'Open Adhan App to keep getting prayer notifications',
    });
  });

  it('plans all 14 days when they fit', () => {
    const plan = fillSchedule(days, {muted: {fajr: true, sunrise: true, dhuhr: true}, headsUp: false, timeFormat: '12h'}, at(11, 0));
    expect(plan).toHaveLength(14 * 3 + 1);
  });

  it('schedules nothing when every prayer is muted', () => {
    const muted = {fajr: true, sunrise: true, dhuhr: true, asr: true, maghrib: true, isha: true};
    expect(fillSchedule(days, {muted, headsUp: false, timeFormat: '12h'}, at(11, 0))).toEqual([]);
  });
});
