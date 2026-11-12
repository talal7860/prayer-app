import {sendToWatch} from '../../modules/watch-sync';
import I18n from '../I18n';

/**
 * What the Apple Watch app and Siri need (targets/_shared/PrayerCore.swift → WatchSettings): the
 * settings that change the times, plus the labels in the phone's language.
 */
export const watchPayload = (settings: Settings) => ({
  location: settings.location,
  city: settings.city,
  calculationMethod: settings.calculationMethod,
  asr: settings.asr,
  highLats: settings.highLats,
  adjustments: settings.adjustments,
  timeFormat: settings.timeFormat,
  labels: {
    fajr: I18n.t('prayer.fajr'),
    sunrise: I18n.t('prayer.sunrise'),
    dhuhr: I18n.t('prayer.dhuhr'),
    asr: I18n.t('prayer.asr'),
    maghrib: I18n.t('prayer.maghrib'),
    isha: I18n.t('prayer.isha'),
    jumuah: I18n.t('prayer.jumuah'),
    app: I18n.t('watch.app'),
    today: I18n.t('watch.today'),
    // Swift's String(format:) placeholder.
    until: I18n.t('watch.until', {label: '%@'}),
    // Siri's answers (targets/_shared/SiriIntents.swift), with positional placeholders because
    // the word order differs between languages.
    siriNext: I18n.t('siri.next', {prayer: '%1$@', time: '%2$@', left: '%3$@'}),
    siriCurrent: I18n.t('siri.current', {prayer: '%1$@', end: '%2$@', left: '%3$@'}),
    siriNone: I18n.t('siri.none', {prayer: '%1$@', time: '%2$@', left: '%3$@'}),
    siriToday: I18n.t('siri.today', {prayer: '%1$@', time: '%2$@'}),
    siriTomorrow: I18n.t('siri.tomorrow', {prayer: '%1$@', time: '%2$@'}),
  },
});

let last = '';

/** Send the settings to the watch (and save them for Siri) when they changed. */
export const syncWatch = (settings: Settings) => {
  const json = JSON.stringify(watchPayload(settings));
  if (json !== last) {
    last = json;
    sendToWatch(json);
  }
};
