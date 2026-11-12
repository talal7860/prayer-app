import {useContext} from 'react';
import AppSettingsContext from '../contexts/AppSettingsContext';

// The context has a default value, so it's never undefined (even without a provider).
const useAppSettings = () => useContext<AppSettingsContextInterface>(AppSettingsContext);

export default useAppSettings;
