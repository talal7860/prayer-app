import React, {useState, useEffect, useCallback} from 'react';
import {Text} from 'react-native';
import Body from '../components/Body';
import PrayerTimes from '../lib/PrayTimes';
import AppStorage from '../lib/AppStorage';
import CalculationMethod from '../constants/calculation-method';

const prayerLabels: Record<string, string> = Object.freeze({
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
});

const HomeScreen = () => {
  const [prayerTimes, setPrayerTimes] =
    useState<PrayerTimeLabel[] | undefined>();
  const date = new Date();
  const processPrayerTimes = useCallback(async () => {
    const method: CalculationMethod = await AppStorage.calculationMethod();
    const PT = new PrayerTimes(method);
    const location: Location = await AppStorage.location();
    const adjustments = await AppStorage.adjustments();
    PT.adjust(adjustments);
    const times = PT.getTimes(
      new Date(),
      [location.lat, location.lng],
      -date.getTimezoneOffset() / 60,
      0,
      '12h',
    );
    // if (adjustments.fajr) {
    //   times.fajr = timeFromString(times.sunrise) - ;
    // }
    setPrayerTimes(
      Object.keys(prayerLabels).map(prayer => ({
        label: prayerLabels[prayer],
        time: times[prayer],
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.toDateString()]);
  useEffect(() => {
    processPrayerTimes();
  }, [processPrayerTimes]);
  return (
    <Body>
      <Text>Home Screen</Text>
      <Text>Prayer Times</Text>
      {prayerTimes?.map(time => (
        <Text key={time.label}>{`${time.label}: ${time.time}`}</Text>
      ))}
    </Body>
  );
};

export default HomeScreen;
