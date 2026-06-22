import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestaurantOrders from './RestaurantOrders';
import { getRestaurant } from '../../api/restaurants';
import { getRestaurantOrders, updateOrderStatus } from '../../api/orders';
import { getProducts } from '../../api/products';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'r1' }),
  useNavigate: () => mockNavigate,
}));
jest.mock('../../api/restaurants', () => ({ getRestaurant: jest.fn() }));
jest.mock('../../api/orders', () => ({ getRestaurantOrders: jest.fn(), updateOrderStatus: jest.fn() }));
jest.mock('../../api/products', () => ({ getProducts: jest.fn() }));
jest.mock('../../components/AppBar', () => () => <div data-testid="appbar" />);

const RESTAURANT = { id: 'r1', name: 'Pizza Roma' };
const PRODUCTS = [
  { id: 'p1', name: 'Garlic Bread' },
  { id: 'p2', name: 'Margherita' },
];
const ORDERS = [
  { id: 'o1', mode: 'delivery', status: 'pending', items: [{ productId: 'p1', quantity: 2 }], pricing: { total: 50 }, createdAt: '2026-06-22T10:00:00.000Z' },
  { id: 'o2', mode: 'pickup', status: 'preparing', items: [{ productId: 'p2', quantity: 1 }], pricing: { total: 62 }, createdAt: '2026-06-22T11:00:00.000Z' },
];

beforeEach(() => {
  getRestaurant.mockResolvedValue(RESTAURANT);
  getRestaurantOrders.mockResolvedValue(ORDERS);
  getProducts.mockResolvedValue(PRODUCTS);
  updateOrderStatus.mockResolvedValue({ ...ORDERS[0], status: 'delivered' });
});
afterEach(() => jest.clearAllMocks());

test('lists the restaurant orders with resolved item names', async () => {
  render(<RestaurantOrders />);
  expect(await screen.findByText('Garlic Bread')).toBeInTheDocument();
  expect(screen.getByText('Margherita')).toBeInTheDocument();
  expect(screen.getByText('Pizza Roma')).toBeInTheDocument();
});

test('shows the empty state when there are no orders', async () => {
  getRestaurantOrders.mockResolvedValue([]);
  render(<RestaurantOrders />);
  expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
});

test('shows an error and no empty-state when loading fails (e.g. 403)', async () => {
  getRestaurantOrders.mockRejectedValue(new Error('Forbidden: Only the restaurant owner can view these orders'));
  render(<RestaurantOrders />);
  expect(await screen.findByText(/only the restaurant owner/i)).toBeInTheDocument();
  expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
});

test('back link navigates to the admin dashboard', async () => {
  render(<RestaurantOrders />);
  await screen.findByText('Garlic Bread');
  fireEvent.click(screen.getByRole('button', { name: /back to admin/i }));
  expect(mockNavigate).toHaveBeenCalledWith('/admin');
});

test('updating a status calls the API and swaps in the returned order', async () => {
  render(<RestaurantOrders />);
  await screen.findByText('Garlic Bread');

  // o1 is pending → advance it to Delivered (its control is the first one).
  fireEvent.click(screen.getAllByRole('button', { name: 'Delivered' })[0]);

  await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith('o1', 'delivered'));
  await waitFor(() => {
    const delivered = screen.getAllByRole('button', { name: 'Delivered' })[0];
    expect(delivered).toHaveAttribute('aria-pressed', 'true');
  });
});

test('shows an error when a status update fails', async () => {
  updateOrderStatus.mockRejectedValue(new Error('Failed to update order status'));
  render(<RestaurantOrders />);
  await screen.findByText('Garlic Bread');
  fireEvent.click(screen.getAllByRole('button', { name: 'Delivered' })[0]);
  expect(await screen.findByText(/failed to update order status/i)).toBeInTheDocument();
});
