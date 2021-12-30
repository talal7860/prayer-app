import React from 'react';
import AppConstants from '../../../AppConstants';
import Body from '../../../components/Body';
import SelectList from '../../../components/SelectList';
import useAppSettings from '../../../hooks/useAppSettings';

const Asr = () => {
  const {settings, setSetting} = useAppSettings();

  return (
    <Body>
      <SelectList
        items={AppConstants.asrJuristics}
        selected={settings.asr}
        onSelect={setSetting('asr')}
      />
    </Body>
  );
};

export default Asr;
