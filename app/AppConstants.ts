import I18n from './I18n';

const numberOfDaysToFetch = 5;

const sounds: Sounds = {
  mecca: {
    name: I18n.t('sounds.mecca'),
    path: 'makkah_azan.mp3',
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
    channelId: 'prayer-time-notifications-mecca',
    soundName: sounds.mecca.path,
  },
};

const pad = (value: number): string => `${value}`.padStart(2, '0');

const timeFormat = (time: Date): string => {
  const hours = time.getHours();
  const mode = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(hours12)}:${pad(time.getMinutes())} ${mode}`;
};

const asrJuristics = ['Standard', 'Hanafi'];

export default {
  notificationChannels,
  numberOfDaysToFetch,
  sounds,
  timeFormat,
  asrJuristics,
};
