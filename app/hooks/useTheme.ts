import Colors from '../theme/Colors';
import useColorScheme from './useColorScheme';

const useTheme = () => {
  const {isDarkMode} = useColorScheme();
  const bodyText = {
    color: isDarkMode ? Colors.light : Colors.dark,
  };

  return {
    styles: {bodyText},
  };
};

export default useTheme;
