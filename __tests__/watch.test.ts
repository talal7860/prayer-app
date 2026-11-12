jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {syncWatch, watchPayload} from '../app/lib/watch';
import {defaultSettings} from '../app/lib/settingsStore';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', adjustments: {isha: 2}};

it('sends what changes the times, and the labels', () => {
  const p = watchPayload(settings);
  expect(p).toMatchObject({
    location: settings.location,
    city: 'Calgary, AB',
    calculationMethod: settings.calculationMethod,
    asr: settings.asr,
    highLats: 'NightMiddle',
    adjustments: {isha: 2},
    timeFormat: '12h',
  });
  expect(p.labels.maghrib).toBe('Maghrib');
  // Swift fills this in with String(format:).
  expect(p.labels.until).toBe('until %@');
  // Nothing the watch doesn't need (notification bells, travel state...).
  expect(Object.keys(p)).not.toContain('muted');
});

it('only sends when something changed', () => {
  // Without the native module (Jest) this is a no-op, but it must not throw.
  expect(() => {
    syncWatch(settings);
    syncWatch(settings);
  }).not.toThrow();
});
