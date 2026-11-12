import type {NextPrayerProps, WidgetHandle} from './types';

// iOS only (the ring needs a live progress view). Metro picks PrayerRing.ios.tsx there.
// Keep this file .tsx: Metro tries every .ts candidate before any .tsx (see NextPrayer.tsx).
const PrayerRing: WidgetHandle<NextPrayerProps> = {
  updateTimeline: () => {},
  updateSnapshot: () => {},
};
export default PrayerRing;
