/** One row of the medium widget. */
export type WidgetPrayer = {name: string; time: string; current: boolean; next: boolean};

/**
 * Everything the widget shows, already formatted: widget layouts run in their own JS
 * runtime with no access to the app's modules (I18n, prayer math, time format).
 */
export type NextPrayerProps = {
  city: string;
  /** "Next prayer" */
  heading: string;
  /** "Asr" */
  next: string;
  /** "3:42 PM" */
  time: string;
  /** The next prayer, in ms since the epoch (for the live countdown). */
  at: number;
  prayers: WidgetPrayer[];
};

export type PrayerActivityProps = {
  /** "Asr" */
  next: string;
  /** "3:42 PM" */
  time: string;
  /** "Asr in" */
  inLabel: string;
  city: string;
  at: number;
};

export type WidgetHandle<P> = {
  updateTimeline(entries: {date: Date; props: P}[]): void;
  updateSnapshot(props: P): void;
};
