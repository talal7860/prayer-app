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

// Opt-in travel alerts: the OS wakes the app when it leaves the saved area. If the prayer
// times there differ by 2+ minutes, post a notification. Opening it shows Today's
// "Update prayer times" banner (useTravelCheck).
TaskManager.defineTask<{eventType: ExpoLocation.GeofencingEventType}>(
  TRAVEL_TASK,
  async ({data, error}) => {
    if (error || data?.eventType !== ExpoLocation.GeofencingEventType.Exit) {
      return;
    }
    try {
      const settings = await loadSettings();
      const pos =
        (await ExpoLocation.getLastKnownPositionAsync({maxAge: 15 * 60 * 1000})) ??
        (await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Low,
        }));
      const here = {lat: pos.coords.latitude, lng: pos.coords.longitude};
      if (!movedEnough(settings, settings.location, here)) {
        return;
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

/** Watch the circle around the saved location when travel alerts are on; stop otherwise. */
export const syncTravelAlerts = async (settings: Settings) => {
  const running = await ExpoLocation.hasStartedGeofencingAsync(TRAVEL_TASK).catch(() => false);
  if (!settings.travelAlerts || !(await backgroundLocationAllowed(false))) {
    if (running) {
      await ExpoLocation.stopGeofencingAsync(TRAVEL_TASK);
    }
    return false;
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
