import {useEffect, useLayoutEffect, useRef} from 'react';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import type {AccessibilityActionEvent, ViewProps} from 'react-native';
import type {TabNavigation} from '../../navigation';
import useAppSettings from '../../hooks/useAppSettings';
import usePalette from '../../hooks/usePalette';
import usePrayerDay from '../../hooks/usePrayerDay';
import useTravelCheck from '../../hooks/useTravelCheck';
import useCityName from '../../hooks/useCityName';
import useExactAlarms from '../../hooks/useExactAlarms';
import useWindowControls from '../../hooks/useWindowControls';
import I18n from '../../I18n';
import {formatCoords, formatTime} from '../../lib/prayerDay';
import {methodName, methodShort} from '../../lib/prayerTimes';
import {paletteFor} from '../../theme/tokens';
import useA11yPrefs, {announce} from '../../hooks/useA11yPrefs';
import {countdownLabel, joinLabel, prayerLabel} from '../../lib/a11y';

/** Everything the three Today layouts (phone, cover, wide) share. */
const useToday = () => {
  const navigation = useNavigation<TabNavigation>();
  const {settings, setSetting} = useAppSettings();
  const {isDark: systemDark} = usePalette();
  const day = usePrayerDay();
  const travel = useTravelCheck();
  const exactAlarms = useExactAlarms();
  useCityName();
  const controls = useWindowControls();

  const night = day.period === 'isha' || day.period === 'fajr';
  const {highContrast} = useA11yPrefs();
  const t = paletteFor(systemDark || night, highContrast);
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
  // The method's acronym ("UKIS") above the list; it opens Settings.
  const method = {
    short: methodShort(settings.calculationMethod),
    name: methodName(settings.calculationMethod),
  };
  const city = settings.city ?? formatCoords(settings.location);
  const {muted} = settings;
  const toggleBell = (key: PrayerKey) => setSetting('muted')({...muted, [key]: !muted[key]});
  const fmtNext = fmt(day.next.time);
  const atLine = fajrEnding
    ? I18n.t('today.endsAt', {time: fmtNext})
    : I18n.t(nextIsTomorrow ? 'today.nextAtTomorrow' : 'today.nextAt', {time: fmtNext});
  const ishaName = I18n.t('prayer.isha');
  // Between sunrise and Dhuhr it isn't any prayer's time, so there's nothing to say.
  const nowLine =
    day.period === 'morning'
      ? ''
      : I18n.t('today.nowTime', {
          label: day.current ? day.list.find(p => p.key === day.current)?.label : ishaName,
        });
  /** The countdown for screen readers, in words and to the minute. */
  const countdownA11y = countdownLabel(
    headline,
    day.next.time.getTime() - day.now.getTime(),
    atLine,
  );

  // When a prayer's time comes, say so (once), if the screen is open. Focusing the countdown
  // reads the time left whenever you want it; it isn't announced as it ticks.
  const focused = useIsFocused();
  const nextId = `${day.next.key}@${day.next.time.getTime()}`;
  const lastNext = useRef(nextId);
  useEffect(() => {
    if (lastNext.current !== nextId) {
      lastNext.current = nextId;
      if (focused) {
        announce(joinLabel(nowLine, countdownA11y));
      }
    }
  }, [nextId, focused, nowLine, countdownA11y]);

  /**
   * One screen-reader stop per prayer row: "Asr, 3:04 PM, now, Reminder, switch, on". Double tap
   * toggles the bell. Sunrise has no bell, so it's plain text.
   */
  const rowA11y = (
    key: PrayerKey,
    label: string,
    time: Date,
    state?: 'now' | 'next',
  ): ViewProps => {
    const text = prayerLabel(label, fmt(time), state);
    if (key === 'sunrise') {
      return {accessible: true, accessibilityLabel: text};
    }
    return {
      accessible: true,
      accessibilityRole: 'switch',
      accessibilityLabel: joinLabel(text, I18n.t('a11y.reminder')),
      accessibilityState: {checked: !muted[key]},
      accessibilityActions: [{name: 'activate'}],
      onAccessibilityAction: (e: AccessibilityActionEvent) => {
        if (e.nativeEvent.actionName === 'activate') {
          toggleBell(key);
        }
      },
    };
  };

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
    method,
    city,
    muted,
    toggleBell,
    atLine,
    nowLine,
    countdownA11y,
    rowA11y,
    /** Room the top bar leaves for the iPadOS window controls. */
    topBarInset: {marginStart: controls.leading, marginEnd: controls.trailing},
  };
};

export type TodayModel = ReturnType<typeof useToday>;

/** "at 5:12 PM" under the countdown on the cover and wide layouts. */
export const nextAtLine = (m: TodayModel) => m.atLine;

/** The bell inside a row: the row is the screen-reader control, so the bell is hidden from it. */
export const hiddenFromA11y = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

export default useToday;
