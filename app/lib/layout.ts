/**
 * Which Today layout fits the window (the redesign canvas's boards):
 * - `phone`: the iPhone board (narrower than 440 pt).
 * - `cover`: the "iPhone Duo — closed" cover screen (~480 pt), also iPad Split View and Slide Over.
 * - `wide`: the iPad board and the open Duo (700 pt and wider).
 */
export type TodayLayout = 'phone' | 'cover' | 'wide';

export const COVER_MIN_WIDTH = 440;
export const WIDE_MIN_WIDTH = 700;

export const todayLayout = (width: number): TodayLayout =>
  width >= WIDE_MIN_WIDTH ? 'wide' : width >= COVER_MIN_WIDTH ? 'cover' : 'phone';

/**
 * The iPad board is drawn at 1194x834; everything on it scales by this. Portrait uses the same
 * sizes as landscape (the long side against 1194), so the dial doesn't shrink on a turned iPad.
 */
export const wideScale = (width: number, height: number): number => {
  const s = Math.min(Math.max(width, height) / 1194, Math.min(width, height) / 834);
  return Math.min(1.2, Math.max(0.6, s));
};

/** Narrowest prayer card that still fits its icon, name and bell in one row. */
export const MIN_CARD_WIDTH = 136;

/** Six cards in a row when they fit, else two rows of three (iPad portrait). */
export const cardColumns = (available: number, gap: number): 3 | 6 =>
  (available - 5 * gap) / 6 >= MIN_CARD_WIDTH ? 6 : 3;

/** Screens other than Today keep their phone layout, in a column this wide on an iPad. */
export const READABLE_WIDTH = 640;
