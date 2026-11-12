import PrayerTimes from '../app/lib/PrayTimes';

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const karachiCalgary = (extra: Record<string, string> = {}) => {
  // @ts-ignore untyped vendored JS
  const PT = new PrayerTimes('Karachi');
  PT.setMethod('Karachi');
  PT.adjust({asr: 'Hanafi', ...extra});
  return PT.getTimes(new Date(2026, 10, 11), [51.05011, -114.08529], -7, 0, '24h');
};

it('uses the method angles for Fajr and Isha, not 90 minutes around sunrise/maghrib', () => {
  const t = karachiCalgary();
  expect(minutes(t.sunrise) - minutes(t.fajr)).toBeGreaterThan(90);
  expect(minutes(t.isha) - minutes(t.maghrib)).toBeGreaterThan(90);
});

it('ignores a leftover fajrIshaCalculation from old saved settings', () => {
  expect(karachiCalgary({fajrIshaCalculation: '90mins'})).toEqual(karachiCalgary());
});
