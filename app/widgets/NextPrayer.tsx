import type {NextPrayerProps, WidgetHandle} from './types';

// Platforms without widgets (tests, web). Metro picks NextPrayer.ios/.android.tsx on devices.
// Keep this file .tsx like the platform files: Metro tries every .ts candidate (incl. the
// plain one) before any .tsx, so a NextPrayer.ts here would shadow NextPrayer.ios.tsx.
const NextPrayer: WidgetHandle<NextPrayerProps> = {
  updateTimeline: () => {},
  updateSnapshot: () => {},
};
export default NextPrayer;
