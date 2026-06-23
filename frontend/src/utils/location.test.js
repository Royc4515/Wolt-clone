import { notifyLocationChanged, LOCATION_CHANGED_EVENT } from './location';

afterEach(() => jest.restoreAllMocks());

test('notifyLocationChanged dispatches the location-changed event', () => {
  const handler = jest.fn();
  window.addEventListener(LOCATION_CHANGED_EVENT, handler);
  notifyLocationChanged();
  expect(handler).toHaveBeenCalledTimes(1);
  window.removeEventListener(LOCATION_CHANGED_EVENT, handler);
});
