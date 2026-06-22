import { getRestaurantOrders, updateOrderStatus } from './orders';
import { apiFetch } from './api';

jest.mock('./api');

afterEach(() => jest.clearAllMocks());

describe('getRestaurantOrders', () => {
  test('GETs the restaurant orders endpoint', async () => {
    apiFetch.mockResolvedValue([]);
    await getRestaurantOrders('r1');
    expect(apiFetch).toHaveBeenCalledWith('/api/orders/restaurant/r1', { method: 'GET' });
  });

  test('returns the order list from the server', async () => {
    const orders = [{ id: 'o1' }];
    apiFetch.mockResolvedValue(orders);
    await expect(getRestaurantOrders('r1')).resolves.toEqual(orders);
  });
});

describe('updateOrderStatus', () => {
  test('PATCHes the status endpoint with the status in the body', async () => {
    apiFetch.mockResolvedValue({ id: 'o1', status: 'preparing' });
    await updateOrderStatus('o1', 'preparing');
    expect(apiFetch).toHaveBeenCalledWith('/api/orders/o1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'preparing' }),
    });
  });

  test('returns the updated order from the server', async () => {
    const updated = { id: 'o1', status: 'delivered' };
    apiFetch.mockResolvedValue(updated);
    await expect(updateOrderStatus('o1', 'delivered')).resolves.toEqual(updated);
  });
});
