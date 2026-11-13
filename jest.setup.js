// expo-widgets needs its native module. Widgets aren't part of the JS tests.
jest.mock('expo-widgets', () => {
  const widget = {updateTimeline: jest.fn(), updateSnapshot: jest.fn(), reload: jest.fn()};
  return {
    createWidget: jest.fn(() => widget),
    createLiveActivity: jest.fn(() => ({start: jest.fn(), getInstances: jest.fn(() => [])})),
  };
});

// expo-audio (the adhan previews in Settings → Adhan sound) has no native module in Jest.
jest.mock('expo-audio', () => {
  const player = {
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  };
  return {
    __player: player,
    useAudioPlayer: () => player,
    useAudioPlayerStatus: () => ({playing: false, didJustFinish: false}),
  };
});
