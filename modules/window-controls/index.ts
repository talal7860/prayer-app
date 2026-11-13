import {requireOptionalNativeModule} from 'expo';

export type WindowControlsInsets = {leading: number; trailing: number};

type WindowControlsModule = {insets(): Promise<WindowControlsInsets>};

// iOS only; missing on Android, in Jest and in Expo Go.
const native = requireOptionalNativeModule<WindowControlsModule>('WindowControls');

export const NO_INSETS: WindowControlsInsets = {leading: 0, trailing: 0};

/** The window controls are 60+ pt wide; smaller corner adjustments are left to the layout. */
const MIN_CONTROLS = 20;
const only = (inset: number) => (inset >= MIN_CONTROLS ? inset : 0);

/**
 * How far the iPadOS window controls (in a resizable window) reach past the safe area, per side.
 * Zero on phones, in full screen, before iPadOS 26 and without the native module.
 */
export const windowControlsInsets = async (): Promise<WindowControlsInsets> => {
  if (!native) {
    return NO_INSETS;
  }
  try {
    const {leading, trailing} = await native.insets();
    return {leading: only(leading), trailing: only(trailing)};
  } catch {
    return NO_INSETS;
  }
};
