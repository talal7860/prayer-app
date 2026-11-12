import ar from '../app/locales/ar.json';
import en from '../app/locales/en.json';
import ur from '../app/locales/ur.json';
import I18n from '../app/I18n';
import {formatTime, hijriLabel} from '../app/lib/prayerDay';

type Tree = {[key: string]: string | Tree};
const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce(
    (acc, [k, v]) => ({
      ...acc,
      ...(typeof v === 'string' ? {[prefix + k]: v} : flatten(v, `${prefix}${k}.`)),
    }),
    {} as Record<string, string>,
  );
const placeholders = (s: string) => (s.match(/{{\w+}}/g) ?? []).sort();

describe.each([
  ['ar', ar],
  ['ur', ur],
])('%s strings', (_, strings) => {
  const english = flatten(en);
  const translated = flatten(strings as Tree);

  it('has every English key and nothing else', () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
  });

  it('keeps the {{placeholders}}', () => {
    Object.entries(english)
      .filter(([key]) => !key.startsWith('adjust.minutes'))
      .forEach(([key, value]) =>
        expect([key, placeholders(translated[key])]).toEqual([key, placeholders(value)]),
      );
  });
});

describe('in Arabic', () => {
  const previous = I18n.locale;
  beforeAll(() => {
    I18n.locale = 'ar';
  });
  afterAll(() => {
    I18n.locale = previous;
  });

  it('formats 12-hour times with Arabic AM/PM and Latin digits', () => {
    expect(formatTime(new Date(2026, 2, 10, 15, 42), '12h')).toBe('3:42 م');
    expect(formatTime(new Date(2026, 2, 10, 5, 7), '12h')).toBe('5:07 ص');
  });

  it('names prayers in Arabic', () => {
    expect(I18n.t('prayer.maghrib')).toBe('المغرب');
  });

  it('writes the Hijri date in Arabic with Latin digits', () => {
    expect(hijriLabel(new Date(2026, 10, 11))).toMatch(/1448/);
  });
});
