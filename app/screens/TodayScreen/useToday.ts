import {useLayoutEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {TabNavigation} from '../../navigation';
import useAppSettings from '../../hooks/useAppSettings';
import usePalette from '../../hooks/usePalette';
import usePrayerDay from '../../hooks/usePrayerDay';
import useTravelCheck from '../../hooks/useTravelCheck';
import useCityName from '../../hooks/useCityName';
import useExactAlarms from '../../hooks/useExactAlarms';
import I18n from '../../I18n';
import {formatCoords, formatTime} from '../../lib/prayerDay';
import {dark, light} from '../../theme/tokens';

/** Everything the three Today layouts (phone, cover, wide) share. */
const useToday = () => {
  const navigation = useNavigation<TabNavigation>();
  const {settings, setSetting, calculationMethod} = useAppSettings();
  const {isDark: systemDark} = usePalette();
  const day = usePrayerDay();
  const travel = useTravelCheck();
  const exactAlarms = useExactAlarms();
  useCityName();

  const night = day.period === 'isha' || day.period === 'fajr';
  const t = systemDark || night ? dark : light;
  const fmt = (d: Date) => formatTime(d, settings.timeFormat);

  // The design darkens the tab bar along with the sheet at night.
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: {backgroundColor: t.bg, borderTopColor: t.border},
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.muted,
    });
  }, [navigation, t]);

  const nextLabel =
    day.list.find(p => p.key === day.next.key && p.time.getTime() === day.next.time.getTime())
      ?.label ?? I18n.t(`prayer.${day.next.key}`);
  // During Fajr the countdown is to sunrise, which is when Fajr's time ends.
  const fajrEnding = day.period === 'fajr' && day.next.key === 'sunrise';
  const fajrLabel = day.list.find(p => p.key === 'fajr')?.label ?? I18n.t('prayer.fajr');
  // After Isha the countdown is to tomorrow's Fajr, which isn't the Fajr in the list.
  const nextIsTomorrow = day.next.time.toDateString() !== day.now.toDateString();
  const headline = fajrEnding
    ? I18n.t('today.endsIn', {label: fajrLabel})
    : I18n.t('today.in', {label: nextLabel});
  const asrName = I18n.t(`asrNames.${settings.asr}`);
  const asrLabel = I18n.t('today.asrLabel', {
    method: calculationMethod().split(',').pop()?.trim(),
    asr: asrName,
  });
  const city = settings.city ?? formatCoords(settings.location);
  const {muted} = settings;
  const toggleBell = (key: PrayerKey) => setSetting('muted')({...muted, [key]: !muted[key]});

  return {
    navigation,
    settings,
    day,
    travel,
    exactAlarms,
    t,
    fmt,
    fajrEnding,
    nextIsTomorrow,
    headline,
    asrLabel,
    city,
    muted,
    toggleBell,
  };
};

export type TodayModel = ReturnType<typeof useToday>;

/** "at 5:12 PM" under the countdown on the cover and wide layouts. */
export const nextAtLine = (m: TodayModel) =>
  m.fajrEnding
    ? I18n.t('today.endsAt', {time: m.fmt(m.day.next.time)})
    : I18n.t(m.nextIsTomorrow ? 'today.nextAtTomorrow' : 'today.nextAt', {
        time: m.fmt(m.day.next.time),
      });

export default useToday;
