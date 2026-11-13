import I18n from '../app/I18n';
import {countdownLabel, isLargeText, joinLabel, prayerLabel, spokenDuration} from '../app/lib/a11y';

const min = 60_000;

describe('spokenDuration', () => {
  it('says hours and minutes in words, rounded up to the minute', () => {
    expect(spokenDuration(30_000)).toBe('less than a minute');
    expect(spokenDuration(min)).toBe('1 minute');
    expect(spokenDuration(min + 1)).toBe('2 minutes');
    expect(spokenDuration(60 * min)).toBe('1 hour');
    expect(spokenDuration(83 * min - 5_000)).toBe('1 hour and 23 minutes');
    expect(spokenDuration(150 * min)).toBe('2 hours and 30 minutes');
  });

  it('changes once a minute, not every second', () => {
    expect(spokenDuration(83 * min - 1_000)).toBe(spokenDuration(82 * min + 1_000));
  });
});

it('builds the countdown and prayer row labels', () => {
  expect(countdownLabel('Asr in', 83 * min, 'at 3:04 PM')).toBe(
    'Asr in 1 hour and 23 minutes, at 3:04 PM',
  );
  expect(prayerLabel('Asr', '3:04 PM', 'now')).toBe('Asr, 3:04 PM, now');
  expect(prayerLabel('Maghrib', '5:12 PM')).toBe('Maghrib, 5:12 PM');
  expect(joinLabel('a', false, null, 'b')).toBe('a, b');
});

it('reflows from 150% text up', () => {
  expect(isLargeText(1.35)).toBe(false);
  expect(isLargeText(1.5)).toBe(true);
});

describe('in Arabic', () => {
  const previous = I18n.locale;
  beforeAll(() => {
    I18n.locale = 'ar';
  });
  afterAll(() => {
    I18n.locale = previous;
  });

  it('uses Arabic words and the Arabic comma', () => {
    expect(spokenDuration(83 * min)).toBe('1 ساعة و23 دقيقة');
    expect(prayerLabel('العصر', '3:04 م', 'now')).toBe('العصر، 3:04 م، الآن');
  });
});
