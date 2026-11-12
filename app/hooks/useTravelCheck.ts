import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import * as ExpoLocation from 'expo-location';
import {cityName} from '../lib/geocode';
import {movedEnough} from '../lib/travel';
import useAppSettings from './useAppSettings';

const round = ({lat, lng}: GeoLocation) => ({
  lat: Math.round(lat * 100) / 100,
  lng: Math.round(lng * 100) / 100,
});

/**
 * When the app comes to the foreground somewhere whose prayer times differ from the saved
 * location's by 2 minutes or more, offer to switch. Only runs if location permission was
 * already granted: it never prompts.
 */
const useTravelCheck = () => {
  const {settings, setSetting, setSettings} = useAppSettings();
  const [prompt, setPrompt] = useState<{city: string; location: GeoLocation} | null>(null);
  const {
    location: saved,
    travelDismissedAt: dismissed,
    calculationMethod,
    asr,
    highLats,
  } = settings;

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
      const calc = {calculationMethod, asr, highLats};
      const farFromSaved = movedEnough(calc, saved, here);
      const alreadyKept = dismissed && !movedEnough(calc, dismissed, here);
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
  }, [saved, dismissed, calculationMethod, asr, highLats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- check() only sets state after awaiting the OS, never synchronously
    void check();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void check();
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
      const {location, city} = prompt;
      setSettings(prev => ({...prev, location, city}));
    }
    setPrompt(null);
  }, [prompt, setSettings]);

  return {prompt, keep, update};
};

export default useTravelCheck;
