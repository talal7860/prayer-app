import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import usePalette from '../../hooks/usePalette';
import {Card} from './Card';
import Icon from './Icon';
import Text from './Text';

type Props<T extends string> = {
  options: {value: T; label: string; detail?: string}[];
  value: T;
  onChange: (value: T) => void;
};

/** A card of single-choice rows with a check on the selected one. */
function ChoiceList<T extends string>({options, value, onChange}: Props<T>) {
  const {t} = usePalette();
  return (
    <Card>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{selected: on}}
            onPress={() => onChange(o.value)}
            style={({pressed}) => [
              styles.row,
              i < options.length - 1 && {borderBottomWidth: 1, borderBottomColor: t.divider},
              pressed && {backgroundColor: t.hi},
            ]}>
            <View style={styles.text}>
              <Text weight={on ? 'semibold' : 'medium'} size={15} color={t.text}>
                {o.label}
              </Text>
              {o.detail ? (
                <Text size={13} color={t.muted}>
                  {o.detail}
                </Text>
              ) : null}
            </View>
            {on ? <Icon name="check" size={20} color={t.accent} strokeWidth={2.2} /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {minHeight: 56, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12},
  text: {flex: 1, minWidth: 0, gap: 2},
});

export default ChoiceList;
