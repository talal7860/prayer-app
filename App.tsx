import React, {useEffect} from 'react';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon, {type IconName} from './app/components/ui/Icon';
import {AppSettingsProvider} from './app/contexts/AppSettingsContext';
import usePalette from './app/hooks/usePalette';
import usePushNotifications from './app/hooks/usePushNotifications';
import I18n from './app/I18n';
import TodayScreen from './app/screens/TodayScreen';
import WeekScreen from './app/screens/WeekScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import LocationScreen from './app/screens/SettingsScreen/Location';
import MethodScreen from './app/screens/SettingsScreen/Method';
import SoundScreen from './app/screens/SettingsScreen/Sound';
import {fonts} from './app/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcons: Record<string, IconName> = {
  today: 'clock',
  week: 'calendar',
  settings: 'sliders',
};

const Tabs = () => {
  const {t} = usePalette();
  return (
    <Tab.Navigator
      initialRouteName="today"
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {backgroundColor: t.bg, borderTopColor: t.border},
        tabBarLabelStyle: {fontFamily: fonts.semibold, fontSize: 11},
        tabBarIcon: ({color}) => (
          <Icon name={tabIcons[route.name]} size={22} color={color} strokeWidth={2} />
        ),
      })}>
      <Tab.Screen
        name="today"
        component={TodayScreen}
        options={{title: I18n.t('today.title')}}
      />
      <Tab.Screen
        name="week"
        component={WeekScreen}
        options={{title: I18n.t('week.title')}}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{title: I18n.t('settings.title')}}
      />
    </Tab.Navigator>
  );
};

const Root = () => {
  const {t, isDark} = usePalette();
  // Keeps the scheduled prayer notifications in sync with the settings.
  usePushNotifications();
  const base = isDark ? DarkTheme : DefaultTheme;
  const theme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.accent,
      background: t.surface,
      card: t.bg,
      text: t.text,
      border: t.border,
    },
  };
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerTitleStyle: {fontFamily: fonts.semibold},
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          contentStyle: {backgroundColor: t.surface},
        }}>
        <Stack.Screen name="tabs" component={Tabs} options={{headerShown: false}} />
        <Stack.Screen
          name="location"
          component={LocationScreen}
          options={{title: I18n.t('locations.title')}}
        />
        <Stack.Screen
          name="method"
          component={MethodScreen}
          options={{title: I18n.t('methods.title')}}
        />
        <Stack.Screen
          name="sound"
          component={SoundScreen}
          options={{title: I18n.t('soundsScreen.title')}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  const [loaded, error] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <Root />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
};

export default App;
