import {requireOptionalNativeModule} from 'expo';

type WatchSyncModule = {send(json: string): void};

// iOS only; missing on Android, in Jest and in Expo Go.
const native = requireOptionalNativeModule<WatchSyncModule>('WatchSync');

/** Send a JSON string to the Apple Watch app. Does nothing without the native module. */
export const sendToWatch = (json: string) => {
  try {
    native?.send(json);
  } catch (error) {
    console.warn(error);
  }
};
