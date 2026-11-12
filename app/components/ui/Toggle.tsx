import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import usePalette from '../../hooks/usePalette';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
};

/** Switch from the redesign (50x30 track inside a 44pt touch target). */
const Toggle = ({value, onChange, accessibilityLabel}: Props) => {
  const {t} = usePalette();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value}}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!value)}
      style={styles.target}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? t.accent : t.trackOff,
            justifyContent: value ? 'flex-end' : 'flex-start',
          },
        ]}>
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  target: {width: 56, height: 44, alignItems: 'center', justifyContent: 'center'},
  track: {
    width: 50,
    height: 30,
    borderRadius: 999,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#14161C',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
});

export default Toggle;
