import type {NextPrayerProps, WidgetHandle} from './types';

// Platforms without widgets (tests, web). Metro picks NextPrayer.ios/.android.tsx on devices.
const NextPrayer: WidgetHandle<NextPrayerProps> = {
  updateTimeline: () => {},
  updateSnapshot: () => {},
};
export default NextPrayer;
