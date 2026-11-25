import {requireOptionalNativeModule, type EventSubscription, type NativeModule} from 'expo';

type Events = {onChange: (event: {keys: string[]}) => void};

declare class CloudSettingsModule extends NativeModule<Events> {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

// iOS only; missing on Android, in Jest and in Expo Go.
const native = requireOptionalNativeModule<CloudSettingsModule>('CloudSettings');

/** The value saved in iCloud key-value storage, or null (none, Android, no native module). */
export const getCloudValue = (key: string): string | null => {
  try {
    return native?.get(key) ?? null;
  } catch (error) {
    console.warn(error);
    return null;
  }
};

/** Save a value in iCloud key-value storage. Does nothing without the native module. */
export const setCloudValue = (key: string, value: string) => {
  try {
    native?.set(key, value);
  } catch (error) {
    console.warn(error);
  }
};

/** Called with the changed keys when iCloud brings values from elsewhere (another device, or the first download after a reinstall). */
export const addCloudChangeListener = (
  listener: (keys: string[]) => void,
): EventSubscription | undefined => native?.addListener('onChange', ({keys}) => listener(keys));
