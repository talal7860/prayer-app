jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {activityFor, nextPrayerProps, widgetTimeline} from '../app/lib/widgetData';
import {prayerTimesFor} from '../app/lib/prayerTimes';
import {defaultSettings} from '../app/lib/settingsStore';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', timeFormat: '24h'};
const on: Settings = {...settings, liveActivity: true};

// Times are shown in the machine's time zone, so take the moments from the computed times
// instead of hard-coding clock hours (CI runs in UTC, Calgary is UTC-7).
const day = new Date(2026, 2, 10, 12);
const times = prayerTimesFor(settings, day);
const at = (key: PrayerKey) => times.find(p => p.key === key)!.time;
const minutes = (n: number) => n * 60 * 1000;
const beforeDhuhr = new Date(at('dhuhr').getTime() - minutes(90));

it('shows the next prayer, its time and the day list', () => {
  const props = nextPrayerProps(settings, beforeDhuhr);
  expect(props.city).toBe('Calgary');
  expect(props.next).toBe('Dhuhr');
  expect(props.at).toBe(at('dhuhr').getTime());
  expect(props.prayers.map(r => r.label)).toEqual(['Fajr', 'Dhuhr', 'Asr', 'Magh', 'Isha']);
  expect(props.prayers.filter(p => p.next).map(p => p.name)).toEqual(['Dhuhr']);
});

it('after Isha the next prayer is the next day’s Fajr', () => {
  const props = nextPrayerProps(settings, new Date(at('isha').getTime() + minutes(30)));
  expect(props.next).toBe('Fajr');
  expect(props.at).toBeGreaterThan(at('isha').getTime());
  // The list moves on to the next day, so it shows the Fajr it counts down to.
  expect(props.prayers.filter(p => p.next).map(p => p.name)).toEqual(['Fajr']);
});

it('the timeline has an entry now and at each prayer time, moving to the next prayer', () => {
  const entries = widgetTimeline(settings, beforeDhuhr);
  expect(entries[0].date).toBe(beforeDhuhr);
  expect(entries.length).toBeGreaterThan(12);
  // Each entry points at a prayer after its own date.
  entries.forEach(e => expect(e.props.at).toBeGreaterThan(e.date.getTime()));
  // At Dhuhr time the widget moves on to Asr.
  const atDhuhr = entries.find(e => e.date.getTime() === at('dhuhr').getTime());
  expect(atDhuhr?.props.next).toBe('Asr');
  // Half-hourly entries in between move the sun along the arc.
  const gaps = entries.slice(1).map((e, i) => e.date.getTime() - entries[i].date.getTime());
  expect(Math.max(...gaps)).toBeLessThanOrEqual(30 * 60 * 1000);
});

it('the Live Activity, when on, only shows in the hour before a prayer', () => {
  const dhuhr = at('dhuhr').getTime();
  expect(activityFor(on, new Date(dhuhr - minutes(120)))).toBeNull();
  const soon = activityFor(on, new Date(dhuhr - minutes(20)));
  expect(soon?.next).toBe('Dhuhr');
  expect(soon?.inLabel).toBe('Dhuhr in');
});

describe('the redesigned widgets', () => {
  it('know the sky, the progress range and the labels', () => {
    const props = nextPrayerProps(settings, beforeDhuhr);
    expect(props.sky).toEqual(['#1E4B86', '#7A6E9C']); // morning
    // Progress runs from the last prayer time (sunrise here) to the next one.
    expect(props.prevAt).toBe(at('sunrise').getTime());
    expect(props.inLabel).toBe('Dhuhr in');
    expect(props.untilLabel).toBe(`until Dhuhr · ${props.time}`);
    expect(props.nextShort).toBe('DHU');
  });

  it('put the sun and the prayers on the arc', () => {
    const props = nextPrayerProps(settings, beforeDhuhr);
    expect(props.sunT).toBeGreaterThan(0);
    expect(props.sunT).toBeLessThan(1);
    expect(props.marks.map(m => m.t)[0]).toBe(0);
    expect(props.marks.map(m => m.t)[4]).toBe(1);
    expect(props.marks.filter(m => m.next)).toHaveLength(1);
    expect(props.marks[0].past).toBe(true);
  });

  it('hide the sun at night and use the Isha sky', () => {
    const night = nextPrayerProps(settings, new Date(at('isha').getTime() + minutes(30)));
    expect(night.sunT).toBe(-1);
    expect(night.sky).toEqual(['#060A1C', '#1B2650']);
  });
});

it('during Fajr counts down to the end of Fajr (sunrise)', () => {
  const props = nextPrayerProps(settings, new Date(at('fajr').getTime() + minutes(10)));
  expect(props.at).toBe(at('sunrise').getTime());
  expect(props.inLabel).toBe('Fajr ends in');
  expect(props.untilLabel).toBe(`until Fajr ends · ${props.time}`);
  expect(activityFor(on, new Date(at('sunrise').getTime() - minutes(20)))?.inLabel).toBe('Fajr ends in');
  // Outside Fajr it's the usual "{Prayer} in".
  expect(nextPrayerProps(settings, beforeDhuhr).inLabel).toBe('Dhuhr in');
});
