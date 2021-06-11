import I18n from './I18n';

const notificationChannel = 'prayer-time-notifications';
const numberOfDaysToFetch = 30;

const sounds = {
  ios: {
    mecca: {
      name: I18n.t('sounds.mecca'),
      path: 'Makkah-Azan.wav',
    },
  },
};

export default {
  notificationChannel,
  numberOfDaysToFetch,
  sounds,
};
