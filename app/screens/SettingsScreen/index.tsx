import React from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import {Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {map} from 'lodash/fp';
import Body from '../../components/Body';
import I18n from '../../I18n';
import styles from './styles';
import useTheme from '../../hooks/useTheme';

const settingsToManage = Object.freeze([
  'location',
  'asr',
  'fajrIshaCalculation',
  'calculationMethod',
  'sound',
]);

const ClickableSettings: React.FunctionComponent<SettingsTitleInterface> = ({
  setting,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={styles.tile}
      // @ts-ignore
      onPress={() => navigation.navigate(setting)}>
      <Text style={[styles.tileLabel, theme.styles.bodyText]}>
        {I18n.t(`settings.${setting}`)}
      </Text>
    </TouchableOpacity>
  );
};

const SettingsScreen = () => (
  <Body>
    <ScrollView>
      {map(setting => (
        <ClickableSettings
          key={`setting-${setting}`}
          // @ts-ignore
          setting={setting}
        />
      ))(settingsToManage)}
    </ScrollView>
  </Body>
);
export default SettingsScreen;
