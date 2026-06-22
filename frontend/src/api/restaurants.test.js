import { getRestaurants } from './restaurants';
import { apiFetch } from './api';

jest.mock('./api');

afterEach(() => jest.clearAllMocks());

describe('getRestaurants', () => {
  test('requests the unfiltered list when no coords are given', async () => {
    apiFetch.mockResolvedValue([]);
    await getRestaurants();
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants', { method: 'GET' });
  });

  test('appends lat & lng query params when coords are given', async () => {
    apiFetch.mockResolvedValue([]);
    await getRestaurants({ lat: 32.08, lng: 34.78 });
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants?lat=32.08&lng=34.78', { method: 'GET' });
  });

  test('ignores partial coords (lat without lng)', async () => {
    apiFetch.mockResolvedValue([]);
    await getRestaurants({ lat: 32.08 });
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants', { method: 'GET' });
  });
});
