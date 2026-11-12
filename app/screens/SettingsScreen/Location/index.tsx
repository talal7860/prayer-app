import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import {Card} from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import Text from '../../../components/ui/Text';
import useAppSettings from '../../../hooks/useAppSettings';
import usePalette from '../../../hooks/usePalette';
import I18n from '../../../I18n';
import {cityName} from '../../../lib/geocode';
import {formatCoords} from '../../../lib/prayerDay';

// City-level accuracy is enough. Never ask the user to turn on Google Location
// Accuracy: declining that dialog fails the request outright. Try a recent fix,
// then low power (network), then GPS for devices without network location.
const findPosition = async (): Promise<ExpoLocation.LocationObject> => {
  const lastKnown = await ExpoLocation.getLastKnownPositionAsync({
    maxAge: 10 * 60 * 1000,
  });
  if (lastKnown) {
    return lastKnown;
  }
  const request = (accuracy: ExpoLocation.Accuracy) =>
    ExpoLocation.getCurrentPositionAsync({
      accuracy,
      mayShowUserSettingsDialog: false,
    });
  try {
    return await request(ExpoLocation.Accuracy.Low);
  } catch {
    return request(ExpoLocation.Accuracy.High);
  }
};

const Location = () => {
  const {settings, setSetting} = useAppSettings();
  const {t} = usePalette();
  const [busy, setBusy] = React.useState(false);

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Unable to open settings');
    });
  };

  const hasLocationPermission = async () => {
    const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      Alert.alert(
        'Turn on Location Services to allow "Prayer app" to determine your location.',
        '',
        [
          {text: 'Go to Settings', onPress: openSettings},
          {text: "Don't Use Location", onPress: () => {}},
        ],
      );
      return false;
    }

    const {granted, canAskAgain} =
      await ExpoLocation.requestForegroundPermissionsAsync();
    if (granted) {
      return true;
    }
    Alert.alert(
      canAskAgain
        ? 'Location permission denied'
        : 'Location permission revoked. Enable it in Settings.',
      '',
      canAskAgain ? undefined : [{text: 'Go to Settings', onPress: openSettings}],
    );
    return false;
  };

  const getLocation = async () => {
    const hasPermission = await hasLocationPermission();

    if (!hasPermission) {
      return;
    }

    setBusy(true);
    try {
      const position = await findPosition();
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setSetting('location')(location);
      setSetting('city')(await cityName(location));
    } catch (error: any) {
      Alert.alert('Unable to get location', error?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
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
