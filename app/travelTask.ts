import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import I18n from './I18n';
import {cityName} from './lib/geocode';
import {loadSettings} from './lib/settingsStore';
import {movedEnough} from './lib/travel';

export const TRAVEL_TASK = 'travel-geofence';
/** Leaving a circle this wide around the saved location wakes the app. */
const RADIUS_M = 25_000;

/** Where we last told the user they'd travelled, so a periodic check doesn't repeat itself. */
const NOTIFIED_KEY = '@prayer_app:travelNotifiedAt';

/**
 * If the phone is somewhere whose prayer times differ from the saved location's by 2+ minutes
 * (and we haven't already said so for this place), post "You're in {city}". Opening it shows
 * Today's "Update prayer times" banner (useTravelCheck). Resolves to whether it notified.
 */
export const checkTravel = async (settings: Settings): Promise<boolean> => {
  const pos =
    (await ExpoLocation.getLastKnownPositionAsync({maxAge: 15 * 60 * 1000})) ??
    (await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Low}));
  const here = {lat: pos.coords.latitude, lng: pos.coords.longitude};
  if (!movedEnough(settings, settings.location, here)) {
    return false;
  }
  const last = await AsyncStorage.getItem(NOTIFIED_KEY).catch(() => null);
  if (last && !movedEnough(settings, JSON.parse(last), here)) {
    return false;
  }
  const city = (await cityName(here))?.split(',')[0];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: city ? I18n.t('travel.title', {city}) : I18n.t('travel.titleNoCity'),
      body: I18n.t('travel.body'),
      data: {travel: true},
    },
    trigger: null,
  });
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(here));
  return true;
};

// iOS: the OS wakes the app when it leaves the circle around the saved location.
// (Android has no fine location, which geofencing needs: the background task checks instead.)
TaskManager.defineTask<{eventType: ExpoLocation.GeofencingEventType}>(
  TRAVEL_TASK,
  async ({data, error}) => {
    if (error || data?.eventType !== ExpoLocation.GeofencingEventType.Exit) {
      return;
    }
    try {
      await checkTravel(await loadSettings());
    } catch (e) {
      console.warn(e);
    }
  },
);

/** Whether background ("Always") location is allowed, asking first if `ask`. */
export const backgroundLocationAllowed = async (ask: boolean) => {
  const fg = ask
    ? await ExpoLocation.requestForegroundPermissionsAsync()
    : await ExpoLocation.getForegroundPermissionsAsync();
  if (!fg.granted) {
    return false;
  }
  const bg = ask
    ? await ExpoLocation.requestBackgroundPermissionsAsync()
    : await ExpoLocation.getBackgroundPermissionsAsync();
  return bg.granted;
};

/**
 * iOS: watch the circle around the saved location when travel alerts are on; stop otherwise.
 * Android: nothing to start, the background task runs `checkTravel` (see backgroundTask.ts).
 */
export const syncTravelAlerts = async (settings: Settings) => {
  const running = await ExpoLocation.hasStartedGeofencingAsync(TRAVEL_TASK).catch(() => false);
  const allowed = settings.travelAlerts && (await backgroundLocationAllowed(false));
  if (Platform.OS === 'android' || !allowed) {
    if (running) {
      await ExpoLocation.stopGeofencingAsync(TRAVEL_TASK);
    }
    return allowed;
  }
  // Starting again replaces the old region, so a new saved location moves the circle.
  await ExpoLocation.startGeofencingAsync(TRAVEL_TASK, [
    {
      identifier: 'saved-location',
      latitude: settings.location.lat,
      longitude: settings.location.lng,
      radius: RADIUS_M,
      notifyOnEnter: false,
      notifyOnExit: true,
    },
  ]);
  return true;
};
