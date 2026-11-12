import {dark, light, type Palette} from '../theme/tokens';
import useColorScheme from './useColorScheme';

/** Light or dark tokens, following the system (or the saved override). */
const usePalette = (forceDark = false): {t: Palette; isDark: boolean} => {
  const {isDarkMode} = useColorScheme();
  const isDark = forceDark || isDarkMode;
  return {t: isDark ? dark : light, isDark};
};

export default usePalette;
