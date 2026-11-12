jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {activityFor, nextPrayerProps, widgetTimeline} from '../app/lib/widgetData';
import {prayerTimesFor} from '../app/lib/prayerTimes';
import {defaultSettings} from '../app/lib/settingsStore';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', timeFormat: '24h'};

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
  expect(props.prayers).toHaveLength(6);
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
  expect(entries[1].date.getTime()).toBe(at('dhuhr').getTime());
  expect(entries[1].props.next).toBe('Asr');
});

it('the Live Activity only shows in the hour before a prayer', () => {
  const dhuhr = at('dhuhr').getTime();
  expect(activityFor(settings, new Date(dhuhr - minutes(120)))).toBeNull();
  const soon = activityFor(settings, new Date(dhuhr - minutes(20)));
  expect(soon?.next).toBe('Dhuhr');
  expect(soon?.inLabel).toBe('Dhuhr in');
});
