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
    {muted: {sunrise: true, asr: true}, endsSoon: false, timeFormat: '12h'},
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

it('never schedules sunrise, even when its bell was on', () => {
  const plan = planNotifications(
    [day(11)],
    {muted: {}, endsSoon: true, timeFormat: '24h'},
    at(11, 0, 0),
  );
  expect(plan.some(p => p.prayer === 'sunrise')).toBe(false);
});

it('reminds 20 minutes before each prayer’s time ends', () => {
  const plan = planNotifications(
    [day(11), day(12)],
    {muted: {}, endsSoon: true, timeFormat: '24h'},
    at(11, 15, 0),
  );
  expect(plan.slice(0, 7).map(p => `${p.kind} ${p.prayer}`)).toEqual([
    'adhan asr',
    'endsSoon asr', // Asr ends at Maghrib
    'adhan maghrib',
    'endsSoon maghrib', // Maghrib ends at Isha
    'adhan isha',
    'endsSoon isha', // Isha ends at the next Fajr
    'adhan fajr',
  ]);
  expect(plan[1]).toMatchObject({date: at(11, 16, 34), title: 'Asr ends in 20 minutes - 16:54'});
  expect(plan[5]).toMatchObject({date: at(12, 5, 56), title: 'Isha ends in 20 minutes - 06:16'});
  // Fajr ends at sunrise.
  expect(plan.find(p => p.kind === 'endsSoon' && p.prayer === 'fajr')).toMatchObject({
    date: at(12, 7, 26),
    title: 'Fajr ends in 20 minutes - 07:46',
  });
  // The last Isha has no next Fajr planned, so no reminder.
  expect(plan.at(-1)).toMatchObject({kind: 'adhan', prayer: 'isha'});
});

it('no ending reminder for a muted prayer', () => {
  const plan = planNotifications(
    [day(11)],
    {muted: {asr: true}, endsSoon: true, timeFormat: '24h'},
    at(11, 15, 0),
  );
  expect(plan.some(p => p.prayer === 'asr')).toBe(false);
});

it('stays under the iOS limit of 64 pending notifications for 5 days', () => {
  const days = [11, 12, 13, 14, 15].map(day);
  const plan = planNotifications(
    days,
    {muted: {sunrise: true}, endsSoon: true, timeFormat: '12h'},
    at(11, 0),
  );
  // 5 adhans and 5 ending reminders a day, less the last Isha's (no next Fajr planned).
  expect(plan.length).toBe(49);
});

describe('fillSchedule', () => {
  const days = Array.from({length: 14}, (_, i) => day(11 + i));

  it('fills the iOS limit and ends with a reminder to open the app', () => {
    const plan = fillSchedule(
      days,
      {muted: {sunrise: true}, endsSoon: false, timeFormat: '12h'},
      at(11, 0),
    );
    expect(plan).toHaveLength(MAX_PENDING);
    // 5 a day: 63 prayers reach Isha's day after 12 full days (12 * 5 = 60, then 3 more).
    const last = plan[MAX_PENDING - 2];
    expect(`${last.date.getDate()} ${last.prayer}`).toBe('23 asr');
    expect(plan[MAX_PENDING - 1]).toMatchObject({
      kind: 'reminder',
      date: new Date(last.date.getTime() + 60000),
      title: 'Open Adhan Times to keep getting prayer notifications',
    });
  });

  it('plans all 14 days when they fit', () => {
    const plan = fillSchedule(
      days,
      {muted: {fajr: true, sunrise: true, dhuhr: true}, endsSoon: false, timeFormat: '12h'},
      at(11, 0),
    );
    expect(plan).toHaveLength(14 * 3 + 1);
  });

  it('schedules nothing when every prayer is muted', () => {
    const muted = {fajr: true, sunrise: true, dhuhr: true, asr: true, maghrib: true, isha: true};
    expect(fillSchedule(days, {muted, endsSoon: false, timeFormat: '12h'}, at(11, 0))).toEqual([]);
  });
});
