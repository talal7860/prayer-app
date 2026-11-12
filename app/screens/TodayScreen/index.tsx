import React, {useLayoutEffect} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import useAppSettings from '../../hooks/useAppSettings';
import usePalette from '../../hooks/usePalette';
import usePrayerDay from '../../hooks/usePrayerDay';
import useTravelCheck from '../../hooks/useTravelCheck';
import useCityName from '../../hooks/useCityName';
import I18n from '../../I18n';
import {
  formatCoords,
  formatCountdown,
  formatTime,
  hijriLabel,
  sunPosition,
} from '../../lib/prayerDay';
import {dark, light, skies, skyLocations} from '../../theme/tokens';
import TravelBanner from './TravelBanner';

const WHITE_88 = 'rgba(255,255,255,0.88)';

const SunArc = ({sun, sunrise, sunset}: {sun: {x: number; y: number} | null; sunrise: string; sunset: string}) => (
  <View style={styles.arc}>
    <Svg width="100%" height={96} viewBox="0 0 342 96" preserveAspectRatio="none" aria-hidden>
      <Path d="M16 78 Q171 -30 326 78" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeDasharray="3 5" fill="none" />
      <Path d="M0 78 H342" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      {sun ? (
        <>
          <Circle cx={sun.x} cy={sun.y} r={14} fill="rgba(255,236,170,0.25)" />
          <Circle cx={sun.x} cy={sun.y} r={7} fill="#FFE7A3" />
        </>
      ) : null}
    </Svg>
    <View style={styles.arcLabels}>
      <Text size={12} color="rgba(255,255,255,0.9)">{I18n.t('today.sunrise', {time: sunrise})}</Text>
      <Text size={12} color="rgba(255,255,255,0.9)">{I18n.t('today.sunset', {time: sunset})}</Text>
    </View>
  </View>
);

const TodayScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {settings, setSetting, calculationMethod} = useAppSettings();
  const {isDark: systemDark} = usePalette();
  const day = usePrayerDay();
  const travel = useTravelCheck();
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
  const nowLine =
    day.period === 'morning'
      ? I18n.t('today.fajrEnded')
      : I18n.t('today.nowTime', {
          label: day.current
            ? day.list.find(p => p.key === day.current)?.label
            : I18n.t('prayer.isha'),
        });
  const city = settings.city ?? formatCoords(settings.location);
  const muted = settings.muted ?? {};
  const toggleBell = (key: PrayerKey) =>
    setSetting('muted')({...muted, [key]: !muted[key]});

  return (
    <View style={[styles.root, {backgroundColor: t.bg}]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={skies[day.period]}
          locations={skyLocations}
          style={[styles.sky, {paddingTop: insets.top + 8}]}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${I18n.t('locations.title')}: ${city}`}
              onPress={() => navigation.navigate('location')}
              style={styles.cityPill}>
              <Icon name="pin" size={18} color="#FFFFFF" strokeWidth={2} />
              <Text weight="medium" size={15} color="#FFFFFF" numberOfLines={1}>
                {city}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={I18n.t('today.settings')}
              onPress={() => navigation.navigate('settings')}
              style={styles.iconButton}>
              <Icon name="sliders" size={20} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.dates}>
            <Text weight="medium" size={15} color="#FFFFFF">
              {day.now.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
            </Text>
            <Text size={13} color="rgba(255,255,255,0.85)">{hijriLabel(day.now)}</Text>
          </View>

          <View style={styles.next} accessible accessibilityLiveRegion="none">
            <Text weight="semibold" size={17} color="#FFFFFF">
              {I18n.t('today.in', {label: nextLabel})}
            </Text>
            <Text weight="light" size={64} color="#FFFFFF" style={styles.countdown}>
              {formatCountdown(day.next.time.getTime() - day.now.getTime())}
            </Text>
            <Text size={14} color={WHITE_88}>
              {I18n.t('today.at', {time: fmt(day.next.time), now: nowLine})}
            </Text>
          </View>

          <View style={styles.skyBottom}>
            {travel.prompt ? (
              <TravelBanner
                city={travel.prompt.city}
                saved={city}
                onKeep={travel.keep}
                onUpdate={travel.update}
              />
            ) : (
              <SunArc
                sun={sunPosition(day.now, day.today)}
                sunrise={fmt(day.today.sunrise)}
                sunset={fmt(day.today.maghrib)}
              />
            )}
          </View>
        </LinearGradient>

        <View style={[styles.sheet, {backgroundColor: t.bg}]}>
          <View style={styles.sheetHead}>
            <Text weight="semibold" size={13} color={t.muted} style={styles.caps}>
              {I18n.t('today.title').toUpperCase()}
            </Text>
            <Text size={13} color={t.muted} numberOfLines={1} style={styles.shrink}>
              {I18n.t('today.asrLabel', {
                method: calculationMethod().split(',').pop()?.trim(),
                asr: settings.asr,
              })}
            </Text>
          </View>
          {day.list.map(p => {
            const isNow = p.key === day.current;
            const past = p.time.getTime() <= day.now.getTime() && !isNow;
            const off = !!muted[p.key];
            return (
              <View key={p.key} style={[styles.row, isNow && {backgroundColor: t.hi}]}>
                <Icon name={p.key} size={20} color={isNow ? t.accent : t.muted} />
                <Text weight={isNow ? 'semibold' : 'medium'} size={16} color={past ? t.past : t.text}>
                  {p.label}
                </Text>
                {isNow ? (
                  <View style={[styles.nowPill, {backgroundColor: t.accent}]}>
                    <Text weight="bold" size={11} color={t.onAccent} style={styles.caps}>
                      {I18n.t('today.now').toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                <Text
                  weight={isNow ? 'semibold' : 'medium'}
                  size={16}
                  color={past ? t.past : t.text}
                  style={styles.time}>
                  {fmt(p.time)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={I18n.t(off ? 'today.bellOff' : 'today.bellOn', {label: p.label})}
                  onPress={() => toggleBell(p.key)}
                  style={styles.bell}>
                  <Icon
                    name={off ? 'bellOff' : 'bell'}
                    size={19}
                    color={off ? t.past : isNow ? t.accent : t.text}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flexGrow: 1},
  sky: {minHeight: 410, paddingHorizontal: 24},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexShrink: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dates: {marginTop: 22, gap: 4},
  next: {marginTop: 26, gap: 2},
  countdown: {lineHeight: 68, letterSpacing: -1.9, fontVariant: ['tabular-nums']},
  skyBottom: {marginTop: 'auto', paddingTop: 20, paddingBottom: 34},
  arc: {height: 104},
  arcLabels: {position: 'absolute', left: 0, right: 0, top: 82, flexDirection: 'row', justifyContent: 'space-between'},
  sheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 2,
  },
  sheetHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, paddingBottom: 10, paddingHorizontal: 8},
  caps: {letterSpacing: 0.8},
  shrink: {flexShrink: 1},
  row: {height: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 4, borderRadius: 14},
  nowPill: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  time: {marginLeft: 'auto', fontVariant: ['tabular-nums']},
  bell: {width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
});

export default TodayScreen;
