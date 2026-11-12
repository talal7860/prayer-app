import type {PrayerActivityProps} from './types';

type Instance = {
  update(props: PrayerActivityProps, staleDate?: Date): Promise<void>;
  end(policy?: 'default' | 'immediate'): Promise<void>;
};

// Live Activities are iOS only. Metro picks PrayerActivity.ios.tsx there.
const PrayerActivity = {
  start: (_props: PrayerActivityProps, _url?: string, _staleDate?: Date): Instance | null => null,
  getInstances: (): Instance[] => [],
  supported: false,
};
export default PrayerActivity;
