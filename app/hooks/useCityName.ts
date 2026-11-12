import {useEffect} from 'react';
import {cityName} from '../lib/geocode';
import useAppSettings from './useAppSettings';

/** Fills in `settings.city` when the saved location has no name yet. */
const useCityName = () => {
  const {settings, setSetting} = useAppSettings();
  const {lat, lng} = settings.location;
  const missing = !settings.city;
  useEffect(() => {
    if (!missing) {
      return;
    }
    let cancelled = false;
    void cityName({lat, lng}).then(city => {
      if (city && !cancelled) {
        setSetting('city')(city);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSetting is new every render; only the location matters
  }, [lat, lng, missing]);
};

export default useCityName;
