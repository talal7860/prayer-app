import React from 'react';
import {Alert, Button, Linking, Text, View} from 'react-native';
import * as ExpoLocation from 'expo-location';
import Body from '../../../components/Body';
import useAppSettings from '../../../hooks/useAppSettings';
import useTheme from '../../../hooks/useTheme';

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
  const theme = useTheme();

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

    try {
      const position = await findPosition();
      setSetting('location')({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error: any) {
      Alert.alert('Unable to get location', error?.message);
    }
  };
  return (
    <Body>
      <View>
        <Text style={theme.styles.bodyText}>Current Location:</Text>
        <Text style={theme.styles.bodyText}>Lat:</Text>
        <Text style={theme.styles.bodyText}>{settings.location.lat}</Text>
        <Text style={theme.styles.bodyText}>Lng:</Text>
        <Text style={theme.styles.bodyText}>{settings.location.lng}</Text>
        <Button title="Get Current Location" onPress={getLocation} />
      </View>
    </Body>
  );
};

export default Location;
