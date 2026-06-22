import { getProducts, getRecommendedProducts } from './products';
import { apiFetch } from './api';

jest.mock('./api');

afterEach(() => jest.clearAllMocks());

describe('getProducts', () => {
  test('requests the products list for a restaurant', async () => {
    apiFetch.mockResolvedValue([]);
    await getProducts('r1');
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants/r1/products', { method: 'GET' });
  });
});

describe('getRecommendedProducts', () => {
  test('requests the recommended endpoint scoped to the restaurant', async () => {
    apiFetch.mockResolvedValue([]);
    await getRecommendedProducts('r1');
    expect(apiFetch).toHaveBeenCalledWith('/api/restaurants/r1/products/recommended', { method: 'GET' });
  });

  test('returns the array the API resolves with', async () => {
    const recs = [{ id: 'p1' }, { id: 'p2' }];
    apiFetch.mockResolvedValue(recs);
    await expect(getRecommendedProducts('r1')).resolves.toEqual(recs);
  });

  test('propagates errors so callers can hide the section', async () => {
    apiFetch.mockRejectedValue(new Error('500'));
    await expect(getRecommendedProducts('r1')).rejects.toThrow('500');
  });
});
