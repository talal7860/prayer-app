import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import usePalette from '../../hooks/usePalette';
import Text from './Text';

type Option<T extends string> = {value: T; label: string};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  minWidth?: number;
  stretch?: boolean;
};

/** iOS-style segmented control from the redesign. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  minWidth = 84,
  stretch = false,
}: Props<T>) {
  const {t, isDark} = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        {backgroundColor: isDark ? t.track : '#EEF0F4'},
        stretch && styles.stretch,
      ]}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{selected: on}}
            onPress={() => onChange(o.value)}
            style={[
              styles.option,
              {minWidth},
              stretch && styles.flex,
              on && [styles.on, {backgroundColor: isDark ? t.hi : '#FFFFFF'}],
            ]}>
            <Text weight="semibold" size={14} color={on ? t.text : t.muted}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {flexDirection: 'row', padding: 3, gap: 3, borderRadius: 11},
  stretch: {alignSelf: 'stretch'},
  option: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {flex: 1},
  on: {
    shadowColor: '#14161C',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
});

export default Segmented;
