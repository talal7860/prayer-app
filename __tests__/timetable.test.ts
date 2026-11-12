jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {monthDays, timetableHtml} from '../app/lib/timetable';
import {defaultSettings} from '../app/lib/settingsStore';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', timeFormat: '24h'};

it('has every day of the month', () => {
  expect(monthDays(settings, new Date(2026, 1, 10))).toHaveLength(28);
  expect(monthDays(settings, new Date(2026, 2, 10))).toHaveLength(31);
});

it('builds a page with a row per day, Fridays marked', () => {
  const html = timetableHtml(settings, new Date(2026, 2, 10), 'en');
  expect(html).toContain('March 2026');
  expect(html).toContain('Calgary, AB');
  expect(html.match(/<tr( class="fri")?><th scope="row">/g)).toHaveLength(31);
  // March 2026 has four Fridays (6, 13, 20, 27).
  expect(html.match(/class="fri"/g)).toHaveLength(4);
  expect(html).toContain('dir="ltr"');
});

it('lays out right to left for Arabic and Urdu', () => {
  expect(timetableHtml(settings, new Date(2026, 2, 10), 'ur')).toContain('dir="rtl"');
});

it('uses the adjusted times', () => {
  const plain = timetableHtml(settings, new Date(2026, 2, 10), 'en');
  const tuned = timetableHtml({...settings, adjustments: {fajr: 5}}, new Date(2026, 2, 10), 'en');
  expect(tuned).not.toEqual(plain);
});
