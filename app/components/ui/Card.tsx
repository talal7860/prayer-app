import React, {type PropsWithChildren} from 'react';
import {Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle} from 'react-native';
import {isLargeText, joinLabel} from '../../lib/a11y';
import usePalette from '../../hooks/usePalette';
import Icon from './Icon';
import Text from './Text';

/** Uppercase section label above a card. */
export const SectionLabel = ({children}: {children: string}) => {
  const {t} = usePalette();
  return (
    <Text
      weight="semibold"
      size={12}
      color={t.muted}
      style={styles.label}
      accessibilityRole="header"
      // Upper case is for the eye: screen readers spell out short all-caps words.
      accessibilityLabel={children}>
      {children.toUpperCase()}
    </Text>
  );
};

export const Card = ({children, style}: PropsWithChildren<{style?: ViewStyle}>) => {
  const {t} = usePalette();
  return (
    <View style={[styles.card, {backgroundColor: t.bg, borderColor: t.border}, style]}>
      {children}
    </View>
  );
};

type RowProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}>;

/**
 * 60pt settings row: title (+ subtitle) on the left, a control or value + chevron on the right.
 * Screen readers get one stop per row: the pressable row, the control (which carries the title as
 * its label), or the title and value read together. At large text sizes a control goes under
 * the text, so the title isn't squeezed to a few letters a line.
 */
export const Row = ({title, subtitle, value, onPress, last, children}: RowProps) => {
  const {t} = usePalette();
  const {fontScale} = useWindowDimensions();
  const stacked = !!children && isLargeText(fontScale);
  const label = joinLabel(title, subtitle, value);
  const body = (
    <>
      <View
        style={[styles.rowText, stacked && styles.rowTextStacked]}
        // With a control, the control says the title; the text would be a second stop.
        accessibilityElementsHidden={!!children}
        importantForAccessibility={children ? 'no-hide-descendants' : 'auto'}>
        <Text weight="medium" size={15} color={t.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={13} color={t.muted} numberOfLines={stacked ? undefined : 1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text size={15} color={t.muted}>
          {value}
        </Text>
      ) : null}
      {children}
      {onPress ? <Icon name="chevron" size={18} color={t.muted} strokeWidth={2} /> : null}
    </>
  );
  const style = [
    styles.row,
    !last && {borderBottomWidth: 1, borderBottomColor: t.divider},
    !onPress && styles.rowControl,
    stacked && styles.rowStacked,
  ];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({pressed}) => [style, pressed && {backgroundColor: t.hi}]}>
      {body}
    </Pressable>
  ) : (
    <View style={style} accessible={!children} accessibilityLabel={children ? undefined : label}>
      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {paddingTop: 18, paddingBottom: 8, paddingHorizontal: 8, letterSpacing: 0.7},
  card: {borderWidth: 1, borderRadius: 18, overflow: 'hidden'},
  row: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowControl: {paddingRight: 12},
  rowText: {flex: 1, minWidth: 0, gap: 1},
  rowStacked: {flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 12},
  rowTextStacked: {flex: 0, alignSelf: 'stretch'},
});
