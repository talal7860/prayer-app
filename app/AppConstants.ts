import I18n from './I18n';

const notificationChannel = 'prayer-time-notifications';
const numberOfDaysToFetch = 5;

const sounds = {
  ios: {
    mecca: {
      name: I18n.t('sounds.mecca'),
      path: 'Makkah-Azan.wav',
    },
  },
};

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
});

export default {
  notificationChannel,
  numberOfDaysToFetch,
  sounds,
  timeFormat,
};
