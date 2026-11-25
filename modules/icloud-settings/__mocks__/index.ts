// An in-memory iCloud key-value store for Jest: `jest.mock('../modules/icloud-settings')`.
type Listener = (keys: string[]) => void;

export const cloudStore = new Map<string, string>();
const listeners = new Set<Listener>();

/** Act as if iCloud brought these values from elsewhere. */
export const cloudChangedExternally = (values: Record<string, string>) => {
  Object.entries(values).forEach(([key, value]) => cloudStore.set(key, value));
  listeners.forEach(listener => listener(Object.keys(values)));
};

export const resetCloud = () => {
  cloudStore.clear();
  listeners.clear();
};

export const getCloudValue = jest.fn((key: string) => cloudStore.get(key) ?? null);

export const setCloudValue = jest.fn((key: string, value: string) => {
  cloudStore.set(key, value);
});

export const addCloudChangeListener = jest.fn((listener: Listener) => {
  listeners.add(listener);
  return {remove: () => listeners.delete(listener)};
});
