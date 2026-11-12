import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import I18n from '../../I18n';

type Props = {city: string; saved: string; onKeep: () => void; onUpdate: () => void};

const BLUE = '#2453B3';

/** "Looks like you're in X now" card from the redesign. Always light. */
const TravelBanner = ({city, saved, onKeep, onUpdate}: Props) => {
  const savedShort = saved.split(',')[0];
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <View style={styles.head}>
        <Icon name="navigate" size={18} color={BLUE} strokeWidth={2} />
        <View style={styles.text}>
          <Text weight="semibold" size={14} color="#14161C">
            {I18n.t('today.travelTitle', {city: city.split(',')[0]})}
          </Text>
          <Text size={12} color="#5A6070">
            {I18n.t('today.travelBody', {saved: savedShort})}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onKeep} style={[styles.button, styles.ghost]}>
          <Text weight="semibold" size={14} color={BLUE}>
            {I18n.t('today.keep', {saved: savedShort})}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onUpdate} style={[styles.button, styles.primary]}>
          <Text weight="semibold" size={14} color="#FFFFFF">
            {I18n.t('today.update')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  head: {flexDirection: 'row', alignItems: 'center', gap: 10},
  text: {flex: 1, minWidth: 0, gap: 1},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap'},
  button: {height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  ghost: {paddingHorizontal: 14},
  primary: {paddingHorizontal: 16, backgroundColor: BLUE},
});

export default TravelBanner;
