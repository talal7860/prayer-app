import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import usePalette from '../hooks/usePalette';
import I18n from '../I18n';
import type {Palette} from '../theme/tokens';
import Icon from './ui/Icon';
import Text from './ui/Text';

type Props = {
  onAllow: () => void;
  /** Today's palette (it goes dark at night); the system one elsewhere. */
  palette?: Palette;
};

/** Asks for Android's "Alarms & reminders" access, so the adhan isn't late. */
const ExactAlarmPrompt = ({onAllow, palette}: Props) => {
  const system = usePalette().t;
  const t = palette ?? system;
  return (
    <View style={[styles.card, {backgroundColor: t.hi, borderColor: t.border}]}>
      <Icon name="bell" size={20} color={t.accent} />
      <View style={styles.text} accessible>
        <Text weight="semibold" size={15} color={t.text}>
          {I18n.t('exactAlarm.title')}
        </Text>
        <Text size={13} color={t.muted}>
          {I18n.t('exactAlarm.body')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${I18n.t('exactAlarm.allow')}: ${I18n.t('exactAlarm.title')}`}
        hitSlop={4}
        onPress={onAllow}
        style={({pressed}) => [
          styles.button,
          {backgroundColor: t.accent, opacity: pressed ? 0.85 : 1},
        ]}>
        <Text weight="semibold" size={14} color={t.onAccent}>
          {I18n.t('exactAlarm.allow')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {flex: 1, gap: 2},
  // 36pt + 4pt hitSlop above and below = 44pt.
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: 18,
    justifyContent: 'center',
  },
});

export default ExactAlarmPrompt;
