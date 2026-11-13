import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import ChoiceList from '../../../components/ui/ChoiceList';
import useAppSettings from '../../../hooks/useAppSettings';
import {METHOD_KEYS, methodName} from '../../../lib/prayerTimes';
import useReadableWidth from '../../../hooks/useReadableWidth';

const MethodScreen = () => {
  const column = useReadableWidth();
  const {settings, setSetting} = useAppSettings();
  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <ChoiceList
        options={METHOD_KEYS.map(key => ({value: key, label: methodName(key)}))}
        value={settings.calculationMethod}
        onChange={setSetting('calculationMethod')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({scroll: {padding: 16}});

export default MethodScreen;
