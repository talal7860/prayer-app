/** One prayer in the medium widget's chips and the large widget's list. */
export type WidgetPrayer = {
  /** "Maghrib" */
  name: string;
  /** Short label for the chips: "Magh" */
  label: string;
  /** "5:54 PM" */
  time: string;
  /** "5:54" (no AM/PM, for the chips) */
  hm: string;
  next: boolean;
  past: boolean;
};

/** A prayer's place on the sun arc: 0 = Fajr, 1 = Isha. */
export type ArcMark = {t: number; next: boolean; past: boolean};

/**
 * Everything the widgets show, already formatted: widget layouts run in their own JS
 * runtime with no access to the app's modules (I18n, prayer math, time format).
 */
export type NextPrayerProps = {
  /** "Calgary" */
  city: string;
  /** "Calgary, AB" */
  cityFull: string;
  /** "1 Jumada II 1448 AH" / "1 Jumada II" */
  hijri: string;
  hijriShort: string;
  /** "Asr" / "ASR" */
  next: string;
  nextShort: string;
  /** "3:42 PM" */
  time: string;
  /** "Asr in", "at 3:42 PM", "until Asr · 3:42 PM" */
  inLabel: string;
  atLabel: string;
  untilLabel: string;
  /** "Next": the large widget's tag, and what VoiceOver adds to the next prayer's row. */
  nextTag: string;
  /** The next prayer and the one before it, in ms since the epoch (live countdown, progress). */
  at: number;
  prevAt: number;
  /** The current period's sky, top-left to bottom-right. */
  sky: [string, string];
  /** Where the sun is on the arc (0 = Fajr, 1 = Isha), or -1 while it's down. */
  sunT: number;
  marks: ArcMark[];
  prayers: WidgetPrayer[];
  /**
   * Android only: what to show from each moment on (now, then every prayer time for two days).
   * Android widgets take no timeline, so the layout picks the entry for `Date.now()` whenever it
   * renders, and a native alarm re-renders it when the countdown reaches zero.
   */
  entries?: {from: number; props: NextPrayerProps}[];
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
