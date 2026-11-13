import {paletteFor, type Palette} from '../theme/tokens';
import useA11yPrefs from './useA11yPrefs';
import useColorScheme from './useColorScheme';

/** Light or dark tokens, following the system (or the saved override) and Increase Contrast. */
const usePalette = (forceDark = false): {t: Palette; isDark: boolean} => {
  const {isDarkMode} = useColorScheme();
  const {highContrast} = useA11yPrefs();
  const isDark = forceDark || isDarkMode;
  return {t: paletteFor(isDark, highContrast), isDark};
};

export default usePalette;
