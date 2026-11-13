import I18n from '../I18n';

/** Text sizes from here up get the reflowed layouts (stacked rows, the week as a list). */
export const LARGE_TEXT = 1.5;

export const isLargeText = (fontScale: number) => fontScale >= LARGE_TEXT;

/**
 * A countdown as words for VoiceOver and TalkBack, to the minute ("1 hour, 23 minutes"), so the
 * label changes once a minute rather than every second. Rounded up, like the visible countdown
 * reaching 0:00 only at the time.
 */
export const spokenDuration = (ms: number) => {
  if (ms < 60_000) {
    return I18n.t('a11y.lessThanMinute');
  }
  const total = Math.ceil(ms / 60_000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hours = h ? I18n.t('a11y.hours', {count: h}) : '';
  const minutes = m ? I18n.t('a11y.minutes', {count: m}) : '';
  return [hours, minutes].filter(Boolean).join(I18n.t('a11y.and'));
};

/** "Asr in 1 hour, 23 minutes, at 3:04 PM". */
export const countdownLabel = (headline: string, ms: number, at: string) =>
  I18n.t('a11y.countdown', {headline, left: spokenDuration(ms), at});

/** A list's parts read as one, with the language's comma. */
export const joinLabel = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(I18n.t('a11y.comma'));

/** "Asr, 3:04 PM, now": one prayer row. */
export const prayerLabel = (name: string, time: string, state?: 'now' | 'next') =>
  joinLabel(name, time, state && I18n.t(`today.${state}`).toLowerCase());
