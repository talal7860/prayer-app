import {useCallback, useState} from 'react';
import {Alert, Linking} from 'react-native';
import * as ExpoLocation from 'expo-location';
import I18n from '../I18n';
import {errorMessage} from '../lib/errors';
import {findPosition, placeFor, type Place} from '../lib/geocode';

const openSettings = () => {
  Linking.openSettings().catch(() => Alert.alert(I18n.t('locations.cantOpenSettings')));
};

const askPermission = async () => {
  if (!(await ExpoLocation.hasServicesEnabledAsync())) {
    Alert.alert(I18n.t('locations.servicesOff'), '', [
      {text: I18n.t('locations.goToSettings'), onPress: openSettings},
      {text: I18n.t('locations.dontUse'), style: 'cancel'},
    ]);
    return false;
  }
  const {granted, canAskAgain} = await ExpoLocation.requestForegroundPermissionsAsync();
  if (granted) {
    return true;
  }
  Alert.alert(
    I18n.t(canAskAgain ? 'locations.denied' : 'locations.revoked'),
    '',
    canAskAgain ? undefined : [{text: I18n.t('locations.goToSettings'), onPress: openSettings}],
  );
  return false;
};

/** Ask for permission, find the device, and name the place. Resolves to null if it can't. */
const useLocate = () => {
  const [busy, setBusy] = useState(false);
  const locate = useCallback(async (): Promise<{
    location: GeoLocation;
    place: Place;
  } | null> => {
    if (!(await askPermission())) {
      return null;
    }
    setBusy(true);
    try {
      const {coords} = await findPosition();
      const location = {lat: coords.latitude, lng: coords.longitude};
      return {location, place: await placeFor(location)};
    } catch (error: unknown) {
      Alert.alert(I18n.t('locations.failed'), errorMessage(error));
      return null;
    } finally {
      setBusy(false);
    }
  }, []);
  return {locate, busy};
};

export default useLocate;
