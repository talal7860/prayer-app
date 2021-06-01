import CalculationMethod from './constants/calculation-method';
import AppStorage from './lib/AppStorage';
import PrayerTimes from './lib/PrayTimes';

const prayerLabels: Record<string, string> = Object.freeze({
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
});

export const userPrayerTimes = async (
  date: Date,
): Promise<PrayerTimeLabel[]> => {
  const method: CalculationMethod = await AppStorage.calculationMethod();
  const PT = new PrayerTimes(method);
  const location: Location = await AppStorage.location();
  const adjustments = await AppStorage.adjustments();
  console.log('ADJUSTMENTS', adjustments);
  PT.adjust(adjustments);
  const times = PT.getTimes(
    new Date(),
    [location.lat, location.lng],
    -date.getTimezoneOffset() / 60,
    0,
    '24h',
  );
  return Object.keys(prayerLabels).map(prayer => {
    const prayerDate = new Date(date.getTime());
    const time = times[prayer].split(':');
    prayerDate.setHours(time[0]);
    prayerDate.setMinutes(time[1]);
    prayerDate.setSeconds(0);
    return {
      label: prayerLabels[prayer],
      time: prayerDate,
    };
  });
};
