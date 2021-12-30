import React from 'react';
import {
  Alert,
  Button,
  Linking,
  PermissionsAndroid,
  Platform,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Body from '../../../components/Body';
import useAppSettings from '../../../hooks/useAppSettings';
import useTheme from '../../../hooks/useTheme';

const Location = () => {
  const {settings, setSetting} = useAppSettings();
  const theme = useTheme();
  const hasPermissionIOS = async () => {
    const openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
      });
    };
    const status = await Geolocation.requestAuthorization('whenInUse');

    if (status === 'granted') {
      return true;
    }

    if (status === 'denied') {
      Alert.alert('Location permission denied');
    }

    if (status === 'disabled') {
      Alert.alert(
        'Turn on Location Services to allow "Prayer app" to determine your location.',
        '',
        [
          {text: 'Go to Settings', onPress: openSetting},
          {text: "Don't Use Location", onPress: () => {}},
        ],
      );
    }

    return false;
  };

  const hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await hasPermissionIOS();
      return hasPermission;
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  const getLocation = async () => {
    const hasPermission = await hasLocationPermission();

    if (!hasPermission) {
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        setSetting('location')({
          lat: position?.coords?.latitude,
          lng: position?.coords?.longitude,
        });
      },
      error => {
        Alert.alert(`Code ${error.code}`, error.message);
        console.log(error);
      },
      {
        accuracy: {
          android: 'low',
          ios: 'reduced',
        },
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
        // distanceFilter: 0,
        // forceRequestLocation: true,
        // forceLocationManager: true,
        // showLocationDialog: locationDialog,
      },
    );
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
