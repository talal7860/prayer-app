import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/** The root stack in App.tsx: the tabs (or the first-run setup) and the settings screens. */
export type RootStackParamList = {
  tabs: undefined;
  setup: undefined;
  location: undefined;
  method: undefined;
  highLats: undefined;
  adjust: undefined;
  sound: undefined;
};

export type TabParamList = {
  today: undefined;
  qibla: undefined;
  week: undefined;
  settings: undefined;
};

/** `useNavigation<TabNavigation>()` in a tab screen: its tab bar and the root stack's screens. */
export type TabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
