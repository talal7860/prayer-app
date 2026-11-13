import {useEffect, useState} from 'react';
import {useWindowDimensions} from 'react-native';
import {
  NO_INSETS,
  windowControlsInsets,
  type WindowControlsInsets,
} from '../../modules/window-controls';

/**
 * Extra leading/trailing room for the iPadOS window controls, for a top bar to pad by.
 * The controls come and go with windowed mode, which always changes the window size, so it
 * re-reads them then.
 */
const useWindowControls = (): WindowControlsInsets => {
  const {width, height} = useWindowDimensions();
  const [insets, setInsets] = useState(NO_INSETS);
  useEffect(() => {
    let live = true;
    void windowControlsInsets().then(next => {
      if (live) {
        setInsets(prev =>
          prev.leading === next.leading && prev.trailing === next.trailing ? prev : next,
        );
      }
    });
    return () => {
      live = false;
    };
  }, [width, height]);
  return insets;
};

export default useWindowControls;
