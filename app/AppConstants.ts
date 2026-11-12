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
    channelId: 'adhan-makkah',
    soundName: sounds.mecca.path,
  },
};

const asrJuristics = ['Standard', 'Hanafi'];

export default {
  notificationChannels,
  sounds,
  asrJuristics,
};
