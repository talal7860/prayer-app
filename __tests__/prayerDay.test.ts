import {
  arcFraction,
  daySlots,
  semiArcPoint,
  daylightMinutes,
  distanceKm,
  formatCoords,
  formatCountdown,
  formatTime,
  periodAt,
  sunPosition,
  tabularHijri,
  type DayTimes,
} from '../app/lib/prayerDay';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const day = (d: number): DayTimes => ({
  fajr: at(d, 6, 16),
  sunrise: at(d, 7, 46),
  dhuhr: at(d, 12, 20),
  asr: at(d, 15, 6),
  maghrib: at(d, 16, 54),
  isha: at(d, 18, 24),
});
const [y, t, n] = [day(10), day(11), day(12)];

describe('formatTime', () => {
  it.each([
    [0, 5, '12h', '12:05 AM'],
    [7, 16, '12h', '7:16 AM'],
    [12, 20, '12h', '12:20 PM'],
    [19, 24, '12h', '7:24 PM'],
    [7, 16, '24h', '07:16'],
    [19, 24, '24h', '19:24'],
  ])('%i:%i in %s is %s', (h, m, f, expected) => {
    expect(formatTime(at(11, h, m), f as TimeFormat)).toBe(expected);
  });

  it('can drop AM/PM', () => {
    expect(formatTime(at(11, 19, 24), '12h', false)).toBe('7:24');
  });
});

describe('formatCountdown', () => {
  it('shows hours only when needed', () => {
    expect(formatCountdown(65 * 1000)).toBe('01:05');
    expect(formatCountdown((3600 + 125) * 1000)).toBe('1:02:05');
    expect(formatCountdown(-5)).toBe('00:00');
  });
});

describe('periodAt', () => {
  it('is Isha (from yesterday) before Fajr, next is Fajr', () => {
    const p = periodAt(at(11, 3), y, t, n);
    expect(p).toMatchObject({period: 'isha', current: null});
    expect(p.next).toEqual({key: 'fajr', time: t.fajr});
  });

  it('is morning between sunrise and Dhuhr, with no current prayer', () => {
    const p = periodAt(at(11, 9), y, t, n);
    expect(p).toMatchObject({period: 'morning', current: null});
    expect(p.next.key).toBe('dhuhr');
  });

  it('is Asr during Asr', () => {
    expect(periodAt(at(11, 15, 30), y, t, n)).toMatchObject({
      period: 'asr',
      current: 'asr',
      next: {key: 'maghrib'},
    });
  });

  it('after Isha, next is tomorrow’s Fajr', () => {
    const p = periodAt(at(11, 22), y, t, n);
    expect(p).toMatchObject({period: 'isha', current: 'isha'});
    expect(p.next.time).toEqual(n.fajr);
  });
});

describe('sunPosition', () => {
  it('is null at night and on the arc during the day', () => {
    expect(sunPosition(at(11, 3), t)).toBeNull();
    expect(sunPosition(t.sunrise, t)).toEqual({x: 16, y: 78});
    const noonish = sunPosition(new Date((t.sunrise.getTime() + t.maghrib.getTime()) / 2), t);
    expect(noonish?.x).toBeCloseTo(171);
    expect(noonish?.y).toBeCloseTo(24);
  });
});

it('daylightMinutes', () => {
  expect(daylightMinutes(t)).toBe(9 * 60 + 8);
});

it('tabularHijri matches a known date', () => {
  // 1 Ramadan 1447 is 18 or 19 Feb 2026 depending on sighting; tabular gives the 18th.
  expect(tabularHijri(new Date(2026, 1, 18))).toEqual({
    day: 1,
    month: 9,
    year: 1447,
  });
});

it('distanceKm: Calgary to Edmonton is about 280 km', () => {
  const km = distanceKm({lat: 51.0501, lng: -114.0853}, {lat: 53.5461, lng: -113.4938});
  expect(km).toBeGreaterThan(270);
  expect(km).toBeLessThan(290);
});

it('formatCoords', () => {
  expect(formatCoords({lat: 51.05011, lng: -114.08529})).toBe('51.05° N, 114.09° W');
});

describe('semicircle arc', () => {
  it('runs from Fajr on the left to Isha on the right, through the top', () => {
    expect(arcFraction(t.fajr, t)).toBe(0);
    expect(arcFraction(t.isha, t)).toBe(1);
    expect(arcFraction(at(11, 3), t)).toBe(0);
    expect(arcFraction(at(11, 23), t)).toBe(1);
    const left = semiArcPoint(0);
    const top = semiArcPoint(0.5);
    const right = semiArcPoint(1);
    expect(left.x).toBeCloseTo(20);
    expect(left.y).toBeCloseTo(290);
    expect(top.x).toBeCloseTo(300);
    expect(top.y).toBeCloseTo(20);
    expect(right.x).toBeCloseTo(580);
  });
});

describe('daySlots', () => {
  const list = (Object.keys(t) as PrayerKey[]).map(key => ({key, label: key, time: t[key]}));
  it('marks the next prayer and the ones gone by', () => {
    const slots = daySlots(list, at(11, 13), {key: 'asr', time: t.asr});
    expect(slots.filter(s => s.isNext).map(s => s.key)).toEqual(['asr']);
    expect(slots.filter(s => s.past).map(s => s.key)).toEqual(['fajr', 'sunrise', 'dhuhr']);
  });
  it("shows tomorrow's Fajr after Isha", () => {
    const slots = daySlots(list, at(11, 20), {key: 'fajr', time: n.fajr});
    const fajr = slots.find(s => s.key === 'fajr');
    expect(fajr?.isNext).toBe(true);
    expect(fajr?.past).toBe(false);
    expect(fajr?.time).toEqual(n.fajr);
    expect(slots.filter(s => s.past)).toHaveLength(5);
  });
});
