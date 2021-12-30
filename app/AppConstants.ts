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

const timeFormat = (time: Date): string => {
  const hours = time.getHours();
  const mode = hours > 12 ? 'pm' : 'am';
  const formattedHours = `${hours > 12 ? hours - 12 : hours}`;
  const minutes = `${time.getMinutes()}`;
  return `${
    formattedHours.length === 1 ? `0${formattedHours}` : formattedHours
  }:${minutes.length === 1 ? `0${minutes}` : minutes} ${mode}`;
};

const asrJuristics = ['Standard', 'Hanafi'];

export default {
  notificationChannels,
  numberOfDaysToFetch,
  sounds,
  timeFormat,
  asrJuristics,
};
