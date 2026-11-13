import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Card} from '../../../components/ui/Card';
import Text from '../../../components/ui/Text';
import useAppSettings from '../../../hooks/useAppSettings';
import usePalette from '../../../hooks/usePalette';
import I18n from '../../../I18n';
import {formatTime, PRAYER_KEYS} from '../../../lib/prayerDay';
import useReadableWidth from '../../../hooks/useReadableWidth';
import {joinLabel} from '../../../lib/a11y';

const LIMIT = 30;

/** "Fajr +2 · Isha −3", or "None". */
export const adjustmentSummary = (adjustments: Settings['adjustments']) => {
  const parts = PRAYER_KEYS.filter(k => adjustments[k]).map(k => {
    const n = adjustments[k] ?? 0;
    return `${I18n.t(`prayer.${k}`)} ${n > 0 ? '+' : '−'}${Math.abs(n)}`;
  });
  return parts.length ? parts.join(' · ') : I18n.t('adjust.none');
};

const Step = ({
  label,
  prayer,
  onPress,
  disabled,
}: {
  label: string;
  prayer: string;
  onPress: () => void;
  disabled: boolean;
}) => {
  const {t} = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${prayer}: ${I18n.t(label === '+' ? 'adjust.later' : 'adjust.earlier')}`}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({pressed}) => [
        styles.step,
        {
          borderColor: t.border,
          backgroundColor: pressed ? t.hi : t.bg,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <Text weight="semibold" size={18} color={t.accent}>
        {label === '+' ? '+' : '−'}
      </Text>
    </Pressable>
  );
};

/** Per-prayer ± minutes, to match the local mosque's timetable. */
const AdjustScreen = () => {
  const column = useReadableWidth();
  const {settings, setSettings, getPrayerTimes} = useAppSettings();
  const {t} = usePalette();
  const today = getPrayerTimes();
  const change = (key: PrayerKey, delta: number) =>
    setSettings(prev => {
      const n = Math.max(-LIMIT, Math.min(LIMIT, (prev.adjustments[key] ?? 0) + delta));
      return {...prev, adjustments: {...prev.adjustments, [key]: n}};
    });

  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <Text size={13} color={t.muted} style={styles.hint}>
        {I18n.t('adjust.hint')}
      </Text>
      <Card>
        {today.map((p, i) => {
          const n = settings.adjustments[p.key] ?? 0;
          const name = I18n.t(`prayer.${p.key}`);
          const time = formatTime(p.time, settings.timeFormat);
          return (
            // One adjustable stop per prayer: swipe up/down (VoiceOver) or use the volume keys /
            // scroll actions (TalkBack) to move it a minute. The ± buttons are for touch.
            <View
              key={p.key}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={joinLabel(name, time)}
              accessibilityValue={{text: I18n.t('adjust.minutes', {count: n})}}
              accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
              onAccessibilityAction={e => {
                if (e.nativeEvent.actionName === 'increment') {
                  change(p.key, 1);
                } else if (e.nativeEvent.actionName === 'decrement') {
                  change(p.key, -1);
                }
              }}
              style={[
                styles.row,
                i < today.length - 1 && {borderBottomWidth: 1, borderBottomColor: t.divider},
              ]}>
              <View style={styles.flex}>
                <Text weight="medium" size={15} color={t.text}>
                  {name}
                </Text>
                <Text size={13} color={t.muted}>
                  {time}
                </Text>
              </View>
              <Step
                label="-"
                prayer={name}
                disabled={n <= -LIMIT}
                onPress={() => change(p.key, -1)}
              />
              <Text
                weight="semibold"
                size={15}
                color={n ? t.text : t.muted}
                style={styles.value}
                accessibilityLabel={I18n.t('adjust.minutes', {count: n})}>
                {n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'}
              </Text>
              <Step
                label="+"
                prayer={name}
                disabled={n >= LIMIT}
                onPress={() => change(p.key, 1)}
              />
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 12},
  hint: {paddingHorizontal: 8, lineHeight: 19},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingHorizontal: 16},
  flex: {flex: 1, gap: 2},
  step: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {minWidth: 36, textAlign: 'center'},
});

export default AdjustScreen;
