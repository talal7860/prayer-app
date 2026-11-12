jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {activityFor, nextPrayerProps, widgetTimeline} from '../app/lib/widgetData';
import {defaultSettings} from '../app/lib/settingsStore';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', timeFormat: '24h'};
// Tue 10 Mar 2026, 11:00 local.
const morning = new Date(2026, 2, 10, 11, 0);

it('shows the next prayer, its time and the day list', () => {
  const props = nextPrayerProps(settings, morning);
  expect(props.city).toBe('Calgary');
  expect(props.next).toBe('Dhuhr');
  expect(props.at).toBeGreaterThan(morning.getTime());
  expect(props.prayers).toHaveLength(6);
  expect(props.prayers.filter(p => p.next).map(p => p.name)).toEqual(['Dhuhr']);
});

it('after Isha the next prayer is tomorrow’s Fajr', () => {
  const props = nextPrayerProps(settings, new Date(2026, 2, 10, 23, 30));
  expect(props.next).toBe('Fajr');
  expect(new Date(props.at).getDate()).toBe(11);
});

it('the timeline has an entry now and at each prayer time, moving to the next prayer', () => {
  const entries = widgetTimeline(settings, morning);
  expect(entries[0].date).toBe(morning);
  expect(entries.length).toBeGreaterThan(12);
  // Each entry points at a prayer after its own date.
  entries.forEach(e => expect(e.props.at).toBeGreaterThan(e.date.getTime()));
  // At Dhuhr time the widget moves on to Asr.
  expect(entries[1].props.next).toBe('Asr');
});

it('the Live Activity only shows in the hour before a prayer', () => {
  const dhuhr = nextPrayerProps(settings, morning).at;
  expect(activityFor(settings, new Date(dhuhr - 2 * 60 * 60 * 1000))).toBeNull();
  const soon = activityFor(settings, new Date(dhuhr - 20 * 60 * 1000));
  expect(soon?.next).toBe('Dhuhr');
  expect(soon?.inLabel).toBe('Dhuhr in');
});
