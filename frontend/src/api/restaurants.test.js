import { getRestaurants, getRecommendedRestaurants } from './restaurants';
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

describe('getRecommendedRestaurants', () => {
  test('requests the recommended endpoint with no coords', async () => {
    apiFetch.mockResolvedValue([]);
    await getRecommendedRestaurants();
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants/recommended', { method: 'GET' });
  });

  test('appends lat & lng so the server can apply the delivery radius', async () => {
    apiFetch.mockResolvedValue([]);
    await getRecommendedRestaurants({ lat: 32.08, lng: 34.78 });
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants/recommended?lat=32.08&lng=34.78', { method: 'GET' });
  });

  test('ignores partial coords (lat without lng)', async () => {
    apiFetch.mockResolvedValue([]);
    await getRecommendedRestaurants({ lat: 32.08 });
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants/recommended', { method: 'GET' });
  });

  test('returns the array the API resolves with', async () => {
    const recs = [{ id: 'r1' }, { id: 'r2' }];
    apiFetch.mockResolvedValue(recs);
    await expect(getRecommendedRestaurants()).resolves.toEqual(recs);
  });

  test('propagates errors so callers can hide the section', async () => {
    apiFetch.mockRejectedValue(new Error('500'));
    await expect(getRecommendedRestaurants()).rejects.toThrow('500');
  });
});
