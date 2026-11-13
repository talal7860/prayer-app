import I18n from './I18n';

/**
 * Adhan sounds. Each is a bundled ≤ 30 s WAV (iOS plays at most 30 s of a notification sound),
 * listed in app.json's expo-notifications `sounds`, with its own Android channel: a channel's
 * sound can't change once it exists. `preview` is the same file, for the picker's play button.
 * Where the recordings come from: assets/sounds/CREDITS.md.
 */
const sounds: Sounds = {
  mecca: {
    name: I18n.t('sounds.mecca'),
    path: 'makkah_azan.wav',
    // v2: the first one was created without audio attributes, and Android 17 plays nothing then.
    channelId: 'adhan-makkah-v2',
    preview: require('../assets/sounds/makkah_azan.wav') as number,
  },
  istanbul: {
    name: I18n.t('sounds.istanbul'),
    path: 'adhan_istanbul.wav',
    channelId: 'adhan-istanbul',
    preview: require('../assets/sounds/adhan_istanbul.wav') as number,
  },
  konya: {
    name: I18n.t('sounds.konya'),
    path: 'adhan_konya.wav',
    channelId: 'adhan-konya',
    preview: require('../assets/sounds/adhan_konya.wav') as number,
  },
  casablanca: {
    name: I18n.t('sounds.casablanca'),
    path: 'adhan_casablanca.wav',
    channelId: 'adhan-casablanca',
    preview: require('../assets/sounds/adhan_casablanca.wav') as number,
  },
  tripoli: {
    name: I18n.t('sounds.tripoli'),
    path: 'adhan_tripoli.wav',
    channelId: 'adhan-tripoli',
    preview: require('../assets/sounds/adhan_tripoli.wav') as number,
  },
  isfahan: {
    name: I18n.t('sounds.isfahan'),
    path: 'adhan_isfahan.wav',
    channelId: 'adhan-isfahan',
    preview: require('../assets/sounds/adhan_isfahan.wav') as number,
  },
  azeez: {
    name: I18n.t('sounds.azeez'),
    path: 'adhan_azeez.wav',
    channelId: 'adhan-azeez',
    preview: require('../assets/sounds/adhan_azeez.wav') as number,
  },
  default: {
    name: I18n.t('sounds.default'),
    path: 'default',
    channelId: 'prayer-time-notifications',
  },
};

/**
 * The Fajr adhan ("as-salatu khayrun min an-nawm"), used for Fajr when `settings.fajrAdhan` is on
 * and an adhan sound is chosen. Not offered as an all-day sound.
 */
const fajrSound = {
  name: I18n.t('soundsScreen.fajr'),
  path: 'adhan_fajr.wav',
  channelId: 'adhan-fajr',
  preview: require('../assets/sounds/adhan_fajr.wav') as number,
};

const notificationChannels: NotificationChannels = Object.fromEntries(
  [...Object.entries(sounds), ['fajr', fajrSound] as const].map(([key, s]) => [
    key,
    {channelId: s.channelId, soundName: s.path},
  ]),
);

/** A sound's display name. A saved key may be a sound this version no longer has. */
const soundName = (key: string): string | undefined =>
  Object.hasOwn(sounds, key) ? sounds[key].name : undefined;

/**
 * The channel (and so the sound) for a prayer's adhan notification: the Fajr adhan at Fajr when
 * that's on and an adhan is chosen, else the chosen sound (falling back to Makkah for a key this
 * version doesn't have).
 */
const adhanChannel = (settings: Pick<Settings, 'sound' | 'fajrAdhan'>, prayer?: PrayerKey) => {
  const key = Object.hasOwn(sounds, settings.sound) ? settings.sound : 'mecca';
  if (prayer === 'fajr' && settings.fajrAdhan && key !== 'default') {
    return notificationChannels.fajr;
  }
  return notificationChannels[key];
};

const asrJuristics = ['Standard', 'Hanafi'];

export default {
  notificationChannels,
  sounds,
  fajrSound,
  soundName,
  adhanChannel,
  asrJuristics,
};
