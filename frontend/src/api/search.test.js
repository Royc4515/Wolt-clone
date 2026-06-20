import { searchAll } from './search';
import { apiFetch } from './api';

jest.mock('./api');

afterEach(() => jest.clearAllMocks());

describe('searchAll', () => {
  test('returns empty results without calling API for empty string', async () => {
    const result = await searchAll('');
    expect(result).toEqual({ restaurants: [], products: [] });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('returns empty results without calling API for whitespace-only string', async () => {
    const result = await searchAll('   ');
    expect(result).toEqual({ restaurants: [], products: [] });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('returns empty results without calling API for null', async () => {
    const result = await searchAll(null);
    expect(result).toEqual({ restaurants: [], products: [] });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('calls apiFetch with correct endpoint for a valid query', async () => {
    apiFetch.mockResolvedValue({ restaurants: [], products: [] });
    await searchAll('burger');
    expect(apiFetch).toHaveBeenCalledWith('/api/search/burger', { method: 'GET' });
  });

  test('trims whitespace before calling API', async () => {
    apiFetch.mockResolvedValue({ restaurants: [], products: [] });
    await searchAll('  sushi  ');
    expect(apiFetch).toHaveBeenCalledWith('/api/search/sushi', { method: 'GET' });
  });

  test('encodes special characters in the query', async () => {
    apiFetch.mockResolvedValue({ restaurants: [], products: [] });
    await searchAll('mac & cheese');
    expect(apiFetch).toHaveBeenCalledWith('/api/search/mac%20%26%20cheese', { method: 'GET' });
  });

  test('returns normalised result when backend sends lowercase keys', async () => {
    const mockData = {
      restaurants: [{ id: 'r1', name: 'Burger Bar', category: 'Burgers' }],
      products: [{ id: 'p1', name: 'Cheeseburger', restId: 'r1' }],
    };
    // searchAll also fetches /api/restaurants to enrich products with their
    // restaurant's metadata; return the restaurant list for that call.
    apiFetch.mockImplementation((url) =>
      Promise.resolve(url === '/api/restaurants' ? mockData.restaurants : mockData)
    );
    const result = await searchAll('burger');
    // Restaurants are enriched with a computed (distance-based) delivery fee.
    expect(result.restaurants).toMatchObject(mockData.restaurants);
    // Original product fields are preserved, enriched with restaurant metadata.
    expect(result.products[0]).toMatchObject({ id: 'p1', name: 'Cheeseburger', restId: 'r1' });
    expect(result.products[0].restaurantName).toBe('Burger Bar');
  });

  test('normalises PascalCase keys from legacy backend response', async () => {
    apiFetch.mockResolvedValue({
      Restaurants: [{ id: 'r1', name: 'Burger Bar' }],
      Products:    [{ id: 'p1', name: 'Cheeseburger' }],
    });
    const result = await searchAll('burger');
    expect(result.restaurants).toHaveLength(1);
    expect(result.products).toHaveLength(1);
  });

  test('propagates API errors to the caller', async () => {
    apiFetch.mockRejectedValue(new Error('Network error'));
    await expect(searchAll('pizza')).rejects.toThrow('Network error');
  });
});
