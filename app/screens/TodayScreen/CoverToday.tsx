import React from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import ExactAlarmPrompt from '../../components/ExactAlarmPrompt';
import I18n, {formatDate} from '../../I18n';
import {daySlots, formatCountdown, hijriLabel} from '../../lib/prayerDay';
import {skies, skyLocations} from '../../theme/tokens';
import SemiArc from './SemiArc';
import TravelBanner from './TravelBanner';
import {hiddenFromA11y, nextAtLine, type TodayModel} from './useToday';

/** The "iPhone Duo — closed" board: a short sky with the semicircle, then a compact list. */
const CoverToday = ({m, width}: {m: TodayModel; width: number}) => {
  const insets = useSafeAreaInsets();
  const {day, t} = m;
  const arcW = Math.min(width - 48, 432);
  const slots = daySlots(day.list, day.now, day.next);

  return (
    <View style={[styles.root, {backgroundColor: t.bg}]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={skies[day.period]}
          locations={skyLocations}
          style={[styles.sky, {paddingTop: insets.top + 8}]}>
          <View style={[styles.topBar, m.topBarInset]}>
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
            <View style={styles.dates} accessible>
              <Text weight="semibold" size={14} color="#FFFFFF">
                {formatDate(day.now, {weekday: 'short', month: 'short', day: 'numeric'})}
              </Text>
              <Text size={12} color="rgba(255,255,255,0.85)">
                {hijriLabel(day.now)}
              </Text>
            </View>
          </View>

          <View style={styles.arc}>
            <SemiArc
              width={arcW}
              now={day.now}
              today={day.today}
              next={day.next}
              size="cover"
              overlayTop={Math.round(arcW * 0.17)}
              accessibilityLabel={m.countdownA11y}>
              <Text weight="semibold" size={16} color="#FFFFFF" maxFontSizeMultiplier={1.4}>
                {m.headline}
              </Text>
              <Text
                weight="light"
                size={60}
                color="#FFFFFF"
                maxFontSizeMultiplier={1.15}
                style={styles.countdown}>
                {formatCountdown(day.next.time.getTime() - day.now.getTime())}
              </Text>
              <Text size={14} color="#FFFFFF" maxFontSizeMultiplier={1.4}>
                {nextAtLine(m)}
              </Text>
            </SemiArc>
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
        </LinearGradient>

        <View style={[styles.sheet, {backgroundColor: t.bg}]}>
          {m.exactAlarms.needed ? (
            <View style={styles.prompt}>
              <ExactAlarmPrompt onAllow={m.exactAlarms.allow} palette={t} />
            </View>
          ) : null}
          {slots.map(s => {
            const off = !!m.muted[s.key];
            const color = s.past ? t.past : t.text;
            const weight = s.isNext ? 'semibold' : 'medium';
            return (
              <View
                key={s.key}
                style={[styles.row, s.isNext && {backgroundColor: t.hi}]}
                {...m.rowA11y(s.key, s.label, s.time, s.isNext ? 'next' : undefined)}>
                <Icon name={s.key} size={19} color={s.isNext ? t.accent : t.muted} />
                <Text weight={weight} size={16} color={color} style={styles.shrink}>
                  {s.label}
                </Text>
                {s.isNext ? (
                  <View style={[styles.nextPill, {backgroundColor: t.accent}]}>
                    <Text weight="bold" size={10} color={t.onAccent} style={styles.caps}>
                      {I18n.t('today.next').toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                <Text weight={weight} size={16} color={color} style={styles.time}>
                  {m.fmt(s.time)}
                </Text>
                {/* Sunrise is never notified, so it has no bell. */}
                {s.key === 'sunrise' ? (
                  <View style={styles.bell} />
                ) : (
                  <Pressable
                    {...hiddenFromA11y}
                    onPress={() => m.toggleBell(s.key)}
                    style={styles.bell}>
                    <Icon name={off ? 'bellOff' : 'bell'} size={18} color={off ? t.past : t.text} />
                  </Pressable>
                )}
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
  sky: {paddingHorizontal: 24, paddingBottom: 54},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexShrink: 1,
  },
  dates: {alignItems: 'flex-end', gap: 2},
  arc: {marginTop: 28, alignSelf: 'center'},
  countdown: {lineHeight: 64, letterSpacing: -1.8, fontVariant: ['tabular-nums']},
  banner: {marginTop: 16},
  sheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 2,
  },
  prompt: {paddingBottom: 12},
  caps: {letterSpacing: 0.6},
  row: {
    minHeight: 46,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: 14,
  },
  nextPill: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  time: {marginLeft: 'auto', fontVariant: ['tabular-nums']},
  shrink: {flexShrink: 1},
  bell: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
});

export default CoverToday;
