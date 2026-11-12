// expo-widgets needs its native module. Widgets aren't part of the JS tests.
jest.mock('expo-widgets', () => {
  const widget = {updateTimeline: jest.fn(), updateSnapshot: jest.fn(), reload: jest.fn()};
  return {
    createWidget: jest.fn(() => widget),
    createLiveActivity: jest.fn(() => ({start: jest.fn(), getInstances: jest.fn(() => [])})),
  };
});
