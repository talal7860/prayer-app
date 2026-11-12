import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Linking} from 'react-native';
import * as ExpoLocation from 'expo-location';
import I18n from '../I18n';
import {headingOf} from '../lib/qibla';

export type HeadingStatus = 'starting' | 'denied' | 'unavailable' | 'ok';

/** No reading in this long means there's no compass (simulators, some tablets). */
const NO_COMPASS_AFTER_MS = 4000;

/**
 * The compass heading, from true north when the phone knows it. Location permission only:
 * it never asks on its own, `allow()` does.
 */
const useHeading = () => {
  const [status, setStatus] = useState<HeadingStatus>('starting');
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const subscription = useRef<ExpoLocation.LocationSubscription | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const stop = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const watch = useCallback(async () => {
    stop();
    let got = false;
    timer.current = setTimeout(() => {
      if (alive.current && !got) {
        setStatus('unavailable');
      }
    }, NO_COMPASS_AFTER_MS);
    try {
      const sub = await ExpoLocation.watchHeadingAsync(
        reading => {
          const value = headingOf(reading);
          if (!alive.current || value === null) {
            return;
          }
          got = true;
          setHeading(value);
          setAccuracy(reading.accuracy);
          setStatus('ok');
        },
        () => alive.current && setStatus('unavailable'),
      );
      if (alive.current) {
        subscription.current = sub;
      } else {
        sub.remove();
      }
    } catch {
      if (alive.current) {
        setStatus('unavailable');
      }
    }
  }, [stop]);

  /**
   * Start the compass again from scratch: drops the last reading and resubscribes, so the
   * phone gives a fresh heading (after calibrating, or when it looks off).
   */
  const recalibrate = useCallback(() => {
    setHeading(null);
    setAccuracy(null);
    setStatus('starting');
    watch();
  }, [watch]);

  /** Ask for location permission (or open Settings once the phone won't ask again). */
  const allow = useCallback(async () => {
    if (!canAskAgain) {
      Linking.openSettings().catch(() => Alert.alert(I18n.t('locations.cantOpenSettings')));
      return;
    }
    const permission = await ExpoLocation.requestForegroundPermissionsAsync();
    setCanAskAgain(permission.canAskAgain);
    if (permission.granted) {
      setStatus('starting');
      watch();
    }
  }, [canAskAgain, watch]);

  useEffect(() => {
    alive.current = true;
    ExpoLocation.getForegroundPermissionsAsync()
      .then(permission => {
        if (!alive.current) {
          return;
        }
        setCanAskAgain(permission.canAskAgain);
        if (permission.granted) {
          watch();
        } else {
          setStatus('denied');
        }
      })
      .catch(() => alive.current && setStatus('unavailable'));
    return () => {
      alive.current = false;
      stop();
    };
  }, [watch, stop]);

  return {status, heading, accuracy, canAskAgain, allow, recalibrate};
};

export default useHeading;
