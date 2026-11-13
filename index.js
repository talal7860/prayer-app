import {registerRootComponent} from 'expo';
import * as Notifications from 'expo-notifications';
import App from './App';
// Defines the background task that keeps prayer notifications scheduled.
import './app/backgroundTask';

// Show prayer-time notifications even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

registerRootComponent(App);
