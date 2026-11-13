import {useSyncExternalStore} from 'react';
import {AccessibilityInfo, Platform} from 'react-native';

/** The display and assistive-tech settings the UI follows. */
export type A11yPrefs = {
  screenReader: boolean;
  reduceMotion: boolean;
  /** iOS Bold Text. Inter's weights are separate fonts, so `Text` bumps the weight itself. */
  boldText: boolean;
  /** iOS Increase Contrast, Android high-contrast text. */
  highContrast: boolean;
};

let prefs: A11yPrefs = {
  screenReader: false,
  reduceMotion: false,
  boldText: false,
  highContrast: false,
};
const listeners = new Set<() => void>();
let started = false;

const set = (patch: Partial<A11yPrefs>) => {
  prefs = {...prefs, ...patch};
  listeners.forEach(l => {
    l();
  });
};

/** One subscription to the system settings for the whole app, however many components read them. */
const start = () => {
  if (started) {
    return;
  }
  started = true;
  // Wrapped twice: test mocks (and older platforms) may not have every query.
  const read = (key: keyof A11yPrefs, query: () => Promise<boolean> | undefined) => {
    try {
      query()
        ?.then(on => {
          set({[key]: on});
        })
        .catch(() => undefined);
    } catch {
      // Not available here.
    }
  };
  read('screenReader', () => AccessibilityInfo.isScreenReaderEnabled());
  read('reduceMotion', () => AccessibilityInfo.isReduceMotionEnabled());
  AccessibilityInfo.addEventListener('screenReaderChanged', on => {
    set({screenReader: on});
  });
  AccessibilityInfo.addEventListener('reduceMotionChanged', on => {
    set({reduceMotion: on});
  });
  if (Platform.OS === 'ios') {
    read('boldText', () => AccessibilityInfo.isBoldTextEnabled());
    read('highContrast', () => AccessibilityInfo.isDarkerSystemColorsEnabled());
    AccessibilityInfo.addEventListener('boldTextChanged', on => {
      set({boldText: on});
    });
    AccessibilityInfo.addEventListener('darkerSystemColorsChanged', on => {
      set({highContrast: on});
    });
  } else if (Platform.OS === 'android') {
    read('highContrast', () => AccessibilityInfo.isHighTextContrastEnabled());
    AccessibilityInfo.addEventListener('highTextContrastChanged', on => {
      set({highContrast: on});
    });
  }
};

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const useA11yPrefs = (): A11yPrefs => useSyncExternalStore(subscribe, () => prefs);

/** Says `message` with VoiceOver or TalkBack, if one is running. */
export const announce = (message: string) => {
  if (prefs.screenReader) {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

export default useA11yPrefs;
