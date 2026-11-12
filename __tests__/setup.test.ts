import {prayerTimesFor} from '../app/lib/prayerTimes';
import {isHighLatitude, recommendedAsr, recommendedMethod} from '../app/lib/recommend';
import {defaultSettings, parseSettings} from '../app/lib/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

it.each([
  ['CA', 'ISNA', 'Standard'],
  ['us', 'ISNA', 'Standard'],
  ['PK', 'Karachi', 'Hanafi'],
  ['SA', 'Makkah', 'Standard'],
  ['EG', 'Egypt', 'Standard'],
  ['IR', 'Tehran', 'Standard'],
  ['GB', 'MWL', 'Standard'],
  [undefined, 'MWL', 'Standard'],
])('in %s suggests %s and %s Asr', (country, method, asr) => {
  expect(recommendedMethod(country)).toBe(method);
  expect(recommendedAsr(country)).toBe(asr);
});

it('isHighLatitude from 48°, north or south', () => {
  expect(isHighLatitude({lat: 51.05, lng: 0})).toBe(true);
  expect(isHighLatitude({lat: -50, lng: 0})).toBe(true);
  expect(isHighLatitude({lat: 33.7, lng: 0})).toBe(false);
});

describe('parseSettings', () => {
  it('a fresh install has not done the setup', () => {
    expect(parseSettings(null)).toMatchObject({onboarded: false, highLats: 'NightMiddle'});
  });

  it('settings saved before the setup existed count as set up', () => {
    expect(parseSettings(JSON.stringify({asr: 'Standard'}))).toMatchObject({
      onboarded: true,
      asr: 'Standard',
    });
  });

  it('keeps a saved unfinished setup unfinished', () => {
    expect(parseSettings(JSON.stringify({onboarded: false})).onboarded).toBe(false);
  });
});

it('the high-latitude rule changes summer Isha in Calgary', () => {
  const june = new Date(2026, 5, 21);
  const isha = (highLats: HighLatRule) =>
    prayerTimesFor({...defaultSettings, highLats}, june).find(p => p.key === 'isha')!.time;
  const middle = isha('NightMiddle');
  const seventh = isha('OneSeventh');
  expect(middle.getTime()).not.toBe(seventh.getTime());
  // A seventh of the night after sunset is earlier than the middle of the night.
  expect(seventh.getTime()).toBeLessThan(middle.getTime());
});

it('an Isha after midnight is dated the next day, after Maghrib', () => {
  const june = new Date(2026, 5, 21);
  const day = prayerTimesFor({...defaultSettings, highLats: 'NightMiddle'}, june);
  const at = (k: PrayerKey) => day.find(p => p.key === k)!.time;
  expect(at('isha').getDate()).toBe(22);
  expect(at('isha').getTime()).toBeGreaterThan(at('maghrib').getTime());
  expect(at('fajr').getDate()).toBe(21);
});
