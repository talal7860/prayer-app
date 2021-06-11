import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {isNull} from 'lodash/fp';
import {useEffect, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';

const useDarkMode = () => {
  const {getItem, setItem} = useAsyncStorage('@prayer_app:color_scheme');
  const systemScheme = useColorScheme();
  const [schemeSetting, setSchemeSetting] = useState<ColorScheme>('system');
  useEffect(() => {
    getItem().then(data => {
      if (!isNull(data)) {
        setSchemeSetting(<ColorScheme>data);
      }
    });
  }, [getItem]);
  useEffect(() => {
    setItem(<string>schemeSetting);
  }, [schemeSetting, setItem]);
  const scheme = useMemo(() => {
    if (schemeSetting === 'system' || !systemScheme) {
      return systemScheme;
    }
    return schemeSetting;
  }, [schemeSetting, systemScheme]);

  const isDarkMode = scheme === 'dark';
  return {
    scheme,
    isDarkMode,
  };
};

export default useDarkMode;
