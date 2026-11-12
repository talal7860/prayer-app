import {useEffect, useMemo, useState} from 'react';
import {addDays, periodAt, toDayTimes, type DayTimes} from '../lib/prayerDay';
import useAppSettings from './useAppSettings';

/** Yesterday/today/tomorrow times plus the current period, re-evaluated every second. */
const usePrayerDay = () => {
  const {getPrayerTimes, today} = useAppSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(() => {
    const base = new Date(today);
    const at = (offset: number): DayTimes => toDayTimes(getPrayerTimes(addDays(base, offset)));
    return {
      yesterday: at(-1),
      today: at(0),
      tomorrow: at(1),
      list: getPrayerTimes(base),
    };
  }, [getPrayerTimes, today]);

  const info = periodAt(now, days.yesterday, days.today, days.tomorrow);
  return {now, ...days, ...info};
};

export default usePrayerDay;
