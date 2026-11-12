import {sendToWatch} from '../../modules/watch-sync';
import I18n from '../I18n';

/**
 * What the Apple Watch app needs (targets/_shared/PrayerCore.swift → WatchSettings): the
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
  },
});

let last = '';

/** Send the settings to the watch when they changed. */
export const syncWatch = (settings: Settings) => {
  const json = JSON.stringify(watchPayload(settings));
  if (json !== last) {
    last = json;
    sendToWatch(json);
  }
};
