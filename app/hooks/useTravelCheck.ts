import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import * as ExpoLocation from 'expo-location';
import {cityName} from '../lib/geocode';
import {distanceKm} from '../lib/prayerDay';
import useAppSettings from './useAppSettings';

const TRAVEL_KM = 25;
const round = ({lat, lng}: GeoLocation) => ({
  lat: Math.round(lat * 100) / 100,
  lng: Math.round(lng * 100) / 100,
});

/**
 * When the app comes to the foreground far from the saved location, offer to switch.
 * Only runs if location permission was already granted: it never prompts.
 */
const useTravelCheck = () => {
  const {settings, setSetting} = useAppSettings();
  const [prompt, setPrompt] = useState<{city: string; location: GeoLocation} | null>(null);
  const saved = settings.location;
  const dismissed = settings.travelDismissedAt;

  const check = useCallback(async () => {
    try {
      const {granted} = await ExpoLocation.getForegroundPermissionsAsync();
      if (!granted) {
        return;
      }
      const pos = await ExpoLocation.getLastKnownPositionAsync({maxAge: 30 * 60 * 1000});
      if (!pos) {
        return;
      }
      const here = {lat: pos.coords.latitude, lng: pos.coords.longitude};
      const farFromSaved = distanceKm(here, saved) > TRAVEL_KM;
      const alreadyKept = dismissed && distanceKm(here, dismissed) <= TRAVEL_KM;
      if (!farFromSaved || alreadyKept) {
        setPrompt(null);
        return;
      }
      const city = await cityName(here);
      if (city) {
        setPrompt({city, location: here});
      }
    } catch {
      // No location right now; try again next time the app opens.
    }
  }, [saved, dismissed]);

  useEffect(() => {
    // check() only sets state after awaiting the OS, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        check();
      }
    });
    return () => sub.remove();
  }, [check]);

  const keep = useCallback(() => {
    if (prompt) {
      setSetting('travelDismissedAt')(round(prompt.location));
    }
    setPrompt(null);
  }, [prompt, setSetting]);

  const update = useCallback(() => {
    if (prompt) {
      setSetting('location')(prompt.location);
      setSetting('city')(prompt.city);
    }
    setPrompt(null);
  }, [prompt, setSetting]);

  return {prompt, keep, update};
};

export default useTravelCheck;
