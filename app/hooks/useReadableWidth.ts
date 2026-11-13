import {useWindowDimensions, type ViewStyle} from 'react-native';
import {READABLE_WIDTH, WIDE_MIN_WIDTH} from '../lib/layout';

const COLUMN: ViewStyle = {width: '100%', maxWidth: READABLE_WIDTH, alignSelf: 'center'};

/**
 * On an iPad (or an open foldable) the phone screens would stretch edge to edge: this centres
 * them in a readable column. Add it to a ScrollView's `contentContainerStyle`. Phones get nothing.
 */
const useReadableWidth = (): ViewStyle | undefined => {
  const {width} = useWindowDimensions();
  return width >= WIDE_MIN_WIDTH ? COLUMN : undefined;
};

export default useReadableWidth;
