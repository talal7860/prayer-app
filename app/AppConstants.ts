import I18n from './I18n';

const sounds: Sounds = {
  mecca: {
    name: I18n.t('sounds.mecca'),
    path: 'makkah_azan.wav',
  },
  default: {
    name: I18n.t('sounds.default'),
    path: 'default',
  },
};

const notificationChannels: NotificationChannels = {
  default: {
    channelId: 'prayer-time-notifications',
    soundName: sounds.default.path,
  },
  mecca: {
    // v2: the first one was created without audio attributes, and Android 17 plays nothing then.
    channelId: 'adhan-makkah-v2',
    soundName: sounds.mecca.path,
  },
};

/** A sound's display name. A saved key may be a sound this version no longer has. */
const soundName = (key: string): string | undefined =>
  Object.hasOwn(sounds, key) ? sounds[key].name : undefined;

const asrJuristics = ['Standard', 'Hanafi'];

export default {
  notificationChannels,
  sounds,
  soundName,
  asrJuristics,
};
