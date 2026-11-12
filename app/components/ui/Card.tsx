import React, {type PropsWithChildren} from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
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
      accessibilityRole="header">
      {children.toUpperCase()}
    </Text>
  );
};

export const Card = ({
  children,
  style,
}: PropsWithChildren<{style?: ViewStyle}>) => {
  const {t} = usePalette();
  return (
    <View
      style={[styles.card, {backgroundColor: t.bg, borderColor: t.border}, style]}>
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

/** 60pt settings row: title (+ subtitle) on the left, a control or value + chevron on the right. */
export const Row = ({title, subtitle, value, onPress, last, children}: RowProps) => {
  const {t} = usePalette();
  const body = (
    <>
      <View style={styles.rowText}>
        <Text weight="medium" size={15} color={t.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={13} color={t.muted} numberOfLines={1}>
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
  ];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      onPress={onPress}
      style={({pressed}) => [style, pressed && {backgroundColor: t.hi}]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
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
});
