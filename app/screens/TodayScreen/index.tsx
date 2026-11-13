import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import I18n, {formatDate} from '../../I18n';
import {formatCountdown, hijriLabel, sunPosition} from '../../lib/prayerDay';
import {todayLayout} from '../../lib/layout';
import {skies, skyLocations} from '../../theme/tokens';
import TravelBanner from './TravelBanner';
import ExactAlarmPrompt from '../../components/ExactAlarmPrompt';
import CoverToday from './CoverToday';
import WideToday from './WideToday';
import useToday, {hiddenFromA11y, type TodayModel} from './useToday';
import {isLargeText, joinLabel} from '../../lib/a11y';

const WHITE_88 = 'rgba(255,255,255,0.88)';

const SunArc = ({
  sun,
  sunrise,
  sunset,
}: {
  sun: {x: number; y: number} | null;
  sunrise: string;
  sunset: string;
}) => (
  <View
    style={styles.arc}
    accessible
    accessibilityLabel={joinLabel(
      I18n.t('today.sunrise', {time: sunrise}),
      I18n.t('today.sunset', {time: sunset}),
    )}>
    <Svg width="100%" height={96} viewBox="0 0 342 96" preserveAspectRatio="none" aria-hidden>
      <Path
        d="M16 78 Q171 -30 326 78"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={1.5}
        strokeDasharray="3 5"
        fill="none"
      />
      <Path d="M0 78 H342" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      {sun ? (
        <>
          <Circle cx={sun.x} cy={sun.y} r={14} fill="rgba(255,236,170,0.25)" />
          <Circle cx={sun.x} cy={sun.y} r={7} fill="#FFE7A3" />
        </>
      ) : null}
    </Svg>
    {/* Full white: at 90% it's under 4.5:1 on the bottom of the morning and noon skies. */}
    <View style={styles.arcLabels}>
      <Text size={12} color="#FFFFFF" maxFontSizeMultiplier={1.6}>
        {I18n.t('today.sunrise', {time: sunrise})}
      </Text>
      <Text size={12} color="#FFFFFF" maxFontSizeMultiplier={1.6}>
        {I18n.t('today.sunset', {time: sunset})}
      </Text>
    </View>
  </View>
);

const PhoneToday = ({m}: {m: TodayModel}) => {
  const insets = useSafeAreaInsets();
  const {fontScale} = useWindowDimensions();
  // At large text sizes the time goes under the prayer's name, so nothing overlaps.
  const big = isLargeText(fontScale);
  const {navigation, day, travel, exactAlarms, t, fmt, fajrEnding, city, muted, nowLine} = m;
  const toggleBell = m.toggleBell;

  return (
    <View style={[styles.root, {backgroundColor: t.bg}]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={skies[day.period]}
          locations={skyLocations}
          style={[styles.sky, {paddingTop: insets.top + 8}]}>
          {/* The date at the start, the location at the end, on one line. */}
          <View style={[styles.topBar, m.topBarInset]}>
            <View style={styles.dates} accessible>
              <Text weight="semibold" size={15} color="#FFFFFF" numberOfLines={1}>
                {formatDate(day.now, {weekday: 'long', month: 'long', day: 'numeric'})}
              </Text>
              <Text size={12} color="rgba(255,255,255,0.85)" numberOfLines={1}>
                {hijriLabel(day.now)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${I18n.t('locations.title')}: ${city}`}
              onPress={() => navigation.navigate('location')}
              style={styles.cityPill}>
              <Icon name="pin" size={16} color="#FFFFFF" strokeWidth={2} />
              <Text
                weight="medium"
                size={14}
                color="#FFFFFF"
                numberOfLines={1}
                style={styles.shrink}>
                {city}
              </Text>
            </Pressable>
          </View>

          <View
            style={styles.next}
            accessible
            accessibilityLabel={joinLabel(m.countdownA11y, !fajrEnding && nowLine)}>
            <Text weight="semibold" size={17} color="#FFFFFF">
              {m.headline}
            </Text>
            {/* Already huge: it scales a little, then stops before it overflows the sky. */}
            <Text
              weight="light"
              size={64}
              color="#FFFFFF"
              maxFontSizeMultiplier={1.3}
              style={styles.countdown}>
              {formatCountdown(day.next.time.getTime() - day.now.getTime())}
            </Text>
            <Text size={14} color={WHITE_88} style={styles.centered}>
              {fajrEnding || !nowLine
                ? m.atLine
                : I18n.t(
                    // After Isha the countdown is to tomorrow's Fajr, which isn't the Fajr in the list.
                    m.nextIsTomorrow ? 'today.atTomorrow' : 'today.at',
                    {time: fmt(day.next.time), now: nowLine},
                  )}
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
          {exactAlarms.needed ? (
            <View style={styles.prompt}>
              <ExactAlarmPrompt onAllow={exactAlarms.allow} palette={t} />
            </View>
          ) : null}
          <View style={styles.sheetHead}>
            <Text
              weight="semibold"
              size={13}
              color={t.muted}
              accessibilityRole="header"
              accessibilityLabel={I18n.t('today.title')}
              style={styles.caps}>
              {I18n.t('today.title').toUpperCase()}
            </Text>
            {/* The method's acronym; the full name is what a screen reader says. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${I18n.t('methods.title')}: ${m.method.name}`}
              accessibilityHint={I18n.t('today.methodHint')}
              onPress={() => navigation.navigate('settings')}
              style={styles.methodLink}>
              <Text weight="bold" size={13} color={t.accent} style={styles.caps}>
                {m.method.short}
              </Text>
              <Icon name="chevron" size={14} color={t.accent} strokeWidth={2.2} />
            </Pressable>
          </View>
          {/* Sunrise is on the sun arc above, so the list has only the five prayers. */}
          {day.list
            .filter(p => p.key !== 'sunrise')
            .map(p => {
              const isNow = p.key === day.current;
              const past = p.time.getTime() <= day.now.getTime() && !isNow;
              const off = !!muted[p.key];
              const time = (
                <Text
                  weight={isNow ? 'semibold' : 'medium'}
                  size={16}
                  color={past ? t.past : t.text}
                  style={styles.time}>
                  {fmt(p.time)}
                </Text>
              );
              return (
                <View
                  key={p.key}
                  style={[styles.row, isNow && {backgroundColor: t.hi}]}
                  {...m.rowA11y(p.key, p.label, p.time, isNow ? 'now' : undefined)}>
                  <Icon name={p.key} size={20} color={isNow ? t.accent : t.muted} />
                  <View style={styles.rowText}>
                    <View style={styles.rowName}>
                      <Text
                        weight={isNow ? 'semibold' : 'medium'}
                        size={16}
                        color={past ? t.past : t.text}
                        style={styles.shrink}>
                        {p.label}
                      </Text>
                      {isNow ? (
                        <View style={[styles.nowPill, {backgroundColor: t.accent}]}>
                          <Text weight="bold" size={11} color={t.onAccent} style={styles.caps}>
                            {I18n.t('today.now').toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {big ? time : null}
                  </View>
                  {big ? null : time}
                  <Pressable
                    {...hiddenFromA11y}
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
    minHeight: 44,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexShrink: 1,
    maxWidth: '55%',
  },
  dates: {flexShrink: 1, minWidth: 0, gap: 2},
  next: {marginTop: 34, gap: 2, alignItems: 'center'},
  centered: {textAlign: 'center'},
  countdown: {lineHeight: 68, letterSpacing: -1.9, fontVariant: ['tabular-nums']},
  skyBottom: {marginTop: 'auto', paddingTop: 20, paddingBottom: 34},
  arc: {height: 104},
  arcLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 82,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  sheetHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 10,
    paddingStart: 8,
  },
  methodLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    marginVertical: -12,
    paddingHorizontal: 6,
  },
  caps: {letterSpacing: 0.8},
  prompt: {paddingTop: 16},
  shrink: {flexShrink: 1},
  row: {
    minHeight: 52,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: 14,
  },
  nowPill: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  rowText: {flex: 1, minWidth: 0, gap: 2},
  rowName: {flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap'},
  time: {fontVariant: ['tabular-nums']},
  bell: {width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
});

/** Picks the board for the window: iPhone, the Duo's cover screen (and iPad Split View), or iPad. */
const TodayScreen = () => {
  const m = useToday();
  const {width, height} = useWindowDimensions();
  const layout = todayLayout(width);
  if (layout === 'wide') {
    return <WideToday m={m} width={width} height={height} />;
  }
  if (layout === 'cover') {
    return <CoverToday m={m} width={width} />;
  }
  return <PhoneToday m={m} />;
};

export default TodayScreen;
