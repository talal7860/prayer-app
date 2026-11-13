import React from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import ExactAlarmPrompt from '../../components/ExactAlarmPrompt';
import I18n, {formatDate} from '../../I18n';
import {cardColumns, wideScale} from '../../lib/layout';
import {daySlots, formatCountdown, hijriLabel, type DaySlot} from '../../lib/prayerDay';
import {skies, skyLocations} from '../../theme/tokens';
import SemiArc from './SemiArc';
import TravelBanner from './TravelBanner';
import {hiddenFromA11y, nextAtLine, type TodayModel} from './useToday';
import {joinLabel} from '../../lib/a11y';

const PILL = 'rgba(255,255,255,0.16)';

type CardProps = {m: TodayModel; slot: DaySlot; width: number; height: number; timeSize: number};

const PrayerCard = ({m, slot, width, height, timeSize}: CardProps) => {
  const {t} = m;
  const off = !!m.muted[slot.key];
  const color = slot.past ? t.past : t.text;
  return (
    <View
      {...m.rowA11y(slot.key, slot.label, slot.time, slot.isNext ? 'next' : undefined)}
      style={[
        styles.card,
        {
          width,
          minHeight: height,
          backgroundColor: slot.isNext ? t.hi : t.raised,
          borderColor: slot.isNext ? t.accent : t.border,
        },
      ]}>
      <View style={styles.cardHead}>
        <Icon name={slot.key} size={18} color={slot.isNext ? t.accent : t.muted} />
        <Text weight="semibold" size={15} color={color} numberOfLines={1} style={styles.shrink}>
          {slot.label}
        </Text>
        {/* Sunrise is never notified, so it has no bell. */}
        {slot.key === 'sunrise' ? (
          <View style={styles.bell} />
        ) : (
          <Pressable
            {...hiddenFromA11y}
            onPress={() => m.toggleBell(slot.key)}
            hitSlop={6}
            style={styles.bell}>
            <Icon name={off ? 'bellOff' : 'bell'} size={16} color={off ? t.past : t.text} />
          </Pressable>
        )}
      </View>
      <View style={styles.cardFoot}>
        {slot.isNext ? (
          <Text weight="bold" size={10} color={t.accent} style={styles.caps}>
            {I18n.t('today.next').toUpperCase()}
          </Text>
        ) : null}
        <Text
          weight="semibold"
          size={timeSize}
          color={color}
          maxFontSizeMultiplier={1.4}
          style={styles.tabular}>
          {m.fmt(slot.time)}
        </Text>
      </View>
    </View>
  );
};

/**
 * The iPad board (and the open iPhone Duo): the whole screen is sky, a big semicircle with the
 * countdown inside it, then a sheet with the six times as cards. Sizes follow `wideScale`.
 */
const WideToday = ({m, width, height}: {m: TodayModel; width: number; height: number}) => {
  const insets = useSafeAreaInsets();
  const {day, t} = m;
  const s = wideScale(width, height);
  const padX = Math.round(40 * s);
  const arcW = Math.min(Math.round(640 * s), width - 2 * padX);
  const gap = Math.round(12 * s);
  const inner = width - insets.left - insets.right - 2 * padX;
  const cols = cardColumns(inner, gap);
  const cardW = Math.floor((inner - (cols - 1) * gap) / cols);
  const cardH = Math.round(112 * s);
  const timeSize = Math.max(18, Math.round(26 * s));
  const slots = daySlots(day.list, day.now, day.next);

  return (
    <LinearGradient colors={skies[day.period]} locations={skyLocations} style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.topBar,
            m.topBarInset,
            {
              paddingTop: insets.top + Math.round(16 * s),
              paddingLeft: insets.left + padX,
              paddingRight: insets.right + padX,
            },
          ]}>
          <View style={styles.third}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${I18n.t('locations.title')}: ${m.city}`}
              onPress={() => m.navigation.navigate('location')}
              style={styles.cityPill}>
              <Icon name="pin" size={18} color="#FFFFFF" strokeWidth={2} />
              <Text weight="medium" size={15} color="#FFFFFF" numberOfLines={1}>
                {m.city}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.third, styles.center]} accessible>
            <Text weight="semibold" size={17} color="#FFFFFF" style={styles.centered}>
              {formatDate(day.now, {weekday: 'long', month: 'long', day: 'numeric'})}
            </Text>
            <Text size={13} color="rgba(255,255,255,0.85)" style={styles.centered}>
              {hijriLabel(day.now)}
            </Text>
          </View>
          <View style={[styles.third, styles.end]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={I18n.t('settings.title')}
              onPress={() => m.navigation.navigate('settings')}
              style={styles.iconButton}>
              <Icon name="sliders" size={20} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <View style={styles.middle}>
          <SemiArc
            width={arcW}
            now={day.now}
            today={day.today}
            next={day.next}
            size="wide"
            overlayTop={Math.round(arcW * 0.18)}
            accessibilityLabel={m.countdownA11y}>
            <Text weight="semibold" size={18} color="#FFFFFF" maxFontSizeMultiplier={1.4}>
              {m.headline}
            </Text>
            <Text
              weight="light"
              size={Math.round(104 * s)}
              color="#FFFFFF"
              maxFontSizeMultiplier={1}
              style={[styles.tabular, {lineHeight: Math.round(110 * s), letterSpacing: -3 * s}]}>
              {formatCountdown(day.next.time.getTime() - day.now.getTime())}
            </Text>
            <Text size={15} color="#FFFFFF" maxFontSizeMultiplier={1.4}>
              {nextAtLine(m)}
            </Text>
          </SemiArc>
          <View
            style={[styles.arcLabels, {width: arcW}]}
            accessible
            accessibilityLabel={joinLabel(
              I18n.t('today.sunrise', {time: m.fmt(day.today.sunrise)}),
              I18n.t('today.sunset', {time: m.fmt(day.today.maghrib)}),
            )}>
            <Text size={13} color="#FFFFFF" style={styles.tabular}>
              {I18n.t('today.sunrise', {time: m.fmt(day.today.sunrise)})}
            </Text>
            <Text size={13} color="#FFFFFF" style={styles.tabular}>
              {I18n.t('today.sunset', {time: m.fmt(day.today.maghrib)})}
            </Text>
          </View>
          {m.travel.prompt ? (
            <View style={styles.banner}>
              <TravelBanner
                city={m.travel.prompt.city}
                saved={m.city}
                onKeep={m.travel.keep}
                onUpdate={m.travel.update}
              />
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.surface,
              paddingLeft: insets.left + padX,
              paddingRight: insets.right + padX,
              paddingBottom: Math.round(28 * s),
            },
          ]}>
          {m.exactAlarms.needed ? (
            <ExactAlarmPrompt onAllow={m.exactAlarms.allow} palette={t} />
          ) : null}
          <View style={styles.sheetHead}>
            <Text
              weight="semibold"
              size={13}
              color={t.muted}
              numberOfLines={1}
              accessibilityRole="header"
              accessibilityLabel={joinLabel(I18n.t('today.title'), m.method.name)}
              style={[styles.caps, styles.shrink]}>
              {`${I18n.t('today.title').toUpperCase()} · ${m.method.short}`}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => m.navigation.navigate('week')}
              style={styles.link}>
              <Text weight="semibold" size={15} color={t.accent}>
                {I18n.t('week.thisWeek')}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.cards, {gap}]}>
            {slots.map(slot => (
              <PrayerCard
                key={slot.key}
                m={m}
                slot={slot}
                width={cardW}
                height={cardH}
                timeSize={timeSize}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flexGrow: 1},
  topBar: {flexDirection: 'row', alignItems: 'center'},
  third: {flex: 1, flexBasis: 0, alignItems: 'flex-start'},
  center: {alignItems: 'center', gap: 2},
  end: {alignItems: 'flex-end'},
  centered: {textAlign: 'center'},
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 999,
    backgroundColor: PILL,
    maxWidth: '100%',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PILL,
  },
  middle: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24},
  arcLabels: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
  banner: {marginTop: 20, width: '100%', maxWidth: 560},
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    gap: 14,
  },
  sheetHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  caps: {letterSpacing: 0.8},
  shrink: {flexShrink: 1},
  link: {minHeight: 44, justifyContent: 'center'},
  cards: {flexDirection: 'row', flexWrap: 'wrap'},
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 6,
    justifyContent: 'space-between',
  },
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 6},
  bell: {
    marginLeft: 'auto',
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFoot: {gap: 2},
  tabular: {fontVariant: ['tabular-nums']},
});

export default WideToday;
