import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Card} from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import Text from '../../../components/ui/Text';
import useAppSettings from '../../../hooks/useAppSettings';
import useLocate from '../../../hooks/useLocate';
import usePalette from '../../../hooks/usePalette';
import I18n from '../../../I18n';
import {formatCoords} from '../../../lib/prayerDay';
import useReadableWidth from '../../../hooks/useReadableWidth';

const Location = () => {
  const column = useReadableWidth();
  const {settings, setSettings} = useAppSettings();
  const {t} = usePalette();
  const {locate, busy} = useLocate();

  const getLocation = async () => {
    const found = await locate();
    if (found) {
      // Not setSetting: its merge would keep the old city when the new one is unknown.
      setSettings(prev => ({...prev, location: found.location, city: found.place.city}));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <Card style={styles.card}>
        <View style={[styles.badge, {backgroundColor: t.hi}]}>
          <Icon name="pin" size={20} color={t.accent} />
        </View>
        <View style={styles.flex}>
          <Text weight="semibold" size={16} color={t.text}>
            {settings.city ?? I18n.t('settings.unknownCity')}
          </Text>
          <Text size={13} color={t.muted}>
            {formatCoords(settings.location)}
          </Text>
        </View>
      </Card>
      <Text size={13} color={t.muted} style={styles.hint}>
        {I18n.t('locations.hint')}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={getLocation}
        style={({pressed}) => [
          styles.button,
          {backgroundColor: t.accent, opacity: pressed || busy ? 0.8 : 1},
        ]}>
        {busy ? (
          <ActivityIndicator color={t.onAccent} />
        ) : (
          <Icon name="navigate" size={18} color={t.onAccent} strokeWidth={2} />
        )}
        <Text weight="semibold" size={15} color={t.onAccent}>
          {I18n.t('locations.useCurrent')}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 12},
  card: {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16},
  badge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1, minWidth: 0, gap: 2},
  hint: {paddingHorizontal: 8},
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default Location;
