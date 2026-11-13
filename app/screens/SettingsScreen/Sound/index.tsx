import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import AppConstants from '../../../AppConstants';
import ChoiceList from '../../../components/ui/ChoiceList';
import useAppSettings from '../../../hooks/useAppSettings';
import useReadableWidth from '../../../hooks/useReadableWidth';

const SoundScreen = () => {
  const column = useReadableWidth();
  const {settings, setSetting} = useAppSettings();
  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <ChoiceList
        options={Object.entries(AppConstants.sounds).map(([key, s]) => ({
          value: key,
          label: s.name,
        }))}
        value={settings.sound}
        onChange={setSetting('sound')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({scroll: {padding: 16}});

export default SoundScreen;
