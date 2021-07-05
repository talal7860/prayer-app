import {useContext} from 'react';
import AppSettingsContext from '../contexts/AppSettingsContext';

const useAppSettings = () => {
  const context = useContext<AppSettingsContextInterface>(AppSettingsContext);

  if (context === undefined) {
    throw new Error('useAppSettings should be used in AppSettingsContext');
  }

  return context;
};

export default useAppSettings;
