import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Checkout from './Checkout';
import { getRestaurant } from '../api/restaurants';
import { createOrder } from '../api/orders';
import { isAuthenticated, getCurrentUser } from '../utils/auth';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => ({ restaurantId: '1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>,
}));

jest.mock('../api/restaurants', () => ({ getRestaurant: jest.fn() }));

jest.mock('../api/orders', () => ({
  createOrder: jest.fn(),
}));

jest.mock('../utils/auth', () => ({
  isAuthenticated: jest.fn(() => true),
  getCurrentUser: jest.fn(() => null),
  USER_LOCATION_KEY: 'user_location',
}));

jest.mock('../components/AppBar', () => () => <div data-testid="appbar" />);

// RESTAURANT has no `location`, so the client distance is 0 and the delivery
// fee equals the base fee (deterministic for tests).
const RESTAURANT = { id: '1', name: 'Pizza Roma', deliveryFee: 9, deliveryTime: '25–35 min' };

// What Dana's server returns from createOrder (authoritative pricing).
const SERVER_ORDER = {
  id: 'o1',
  pricing: { subtotal: 110, serviceFee: 2, deliveryFee: 9, finalTip: 0, total: 121 },
  estimatedTime: 30,
};

const CART = [
  { item: { id: 'i1', name: 'Garlic Bread', price: 24, image: '', maxQty: 5 }, qty: 2 },
  { item: { id: 'i2', name: 'Margherita', price: 62, image: '', maxQty: 5 }, qty: 1 },
];

const seedCart = (items = CART) => localStorage.setItem('cart_1', JSON.stringify(items));
const seedLocation = () => localStorage.setItem('user_location', JSON.stringify({ lat: 32.08, lng: 34.78 }));

beforeEach(() => {
  getRestaurant.mockResolvedValue(RESTAURANT);
  createOrder.mockResolvedValue(SERVER_ORDER);
  isAuthenticated.mockReturnValue(true);
  seedLocation();
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Checkout — guards', () => {
  test('redirects to /login when not authenticated', () => {
    isAuthenticated.mockReturnValue(false);
    seedCart();
    render(<Checkout />);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  test('redirects to restaurant when cart is empty', () => {
    render(<Checkout />);
    expect(mockNavigate).toHaveBeenCalledWith('/restaurant/1', { replace: true });
  });
});

describe('Checkout — summary & totals (mirrors server)', () => {
  test('renders each item with its unit price', async () => {
    seedCart();
    render(<Checkout />);
    expect(await screen.findByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
    expect(screen.getByText('₪24.00')).toBeInTheDocument();
    expect(screen.getByText('₪62.00')).toBeInTheDocument();
  });

  test('breaks down subtotal, ₪2 service fee, delivery and total', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('checkout-subtotal')).toHaveTextContent('₪110.00');
    expect(screen.getByTestId('checkout-service-fee')).toHaveTextContent('₪2.00');
    expect(screen.getByTestId('checkout-delivery-fee')).toHaveTextContent('₪9.00');
    // 110 + 2 + 9 = 121
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪121.00');
  });

  test('shows Free when deliveryFee is 0', async () => {
    seedCart();
    getRestaurant.mockResolvedValue({ ...RESTAURANT, deliveryFee: 0 });
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('checkout-delivery-fee')).toHaveTextContent(/free/i);
  });
});

describe('Checkout — fulfillment', () => {
  test('pickup keeps the service fee but drops delivery; total = subtotal + service', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('tab', { name: /pickup/i }));
    expect(screen.queryByTestId('checkout-delivery-fee')).not.toBeInTheDocument();
    expect(screen.getByTestId('checkout-service-fee')).toHaveTextContent('₪2.00');
    // 110 + 2 = 112
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪112.00');
  });
});

describe('Checkout — tip', () => {
  test('selecting a tip adds it to the total', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('button', { name: '₪10' }));
    expect(screen.getByTestId('checkout-tip')).toHaveTextContent('₪10.00');
    // 121 + 10 = 131
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪131.00');
  });
});

describe('Checkout — editing items', () => {
  test('increasing quantity updates subtotal and persists the cart', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('button', { name: /increase garlic bread/i }));
    // 24*3 + 62 = 134
    expect(screen.getByTestId('checkout-subtotal')).toHaveTextContent('₪134.00');
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('cart_1'));
      expect(saved.find((e) => e.item.id === 'i1').qty).toBe(3);
    });
  });

  test('Add more navigates back to the restaurant', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('button', { name: /add more/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/restaurant/1');
  });
});

describe('Checkout — delivery location', () => {
  test('blocks placing and offers pickup when no location on delivery', async () => {
    localStorage.removeItem('user_location');
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('place-order-btn')).toBeDisabled();
    expect(screen.getByRole('button', { name: /switch to pickup/i })).toBeInTheDocument();
  });

  test('reads the delivery location from the JWT (no local cache needed)', async () => {
    localStorage.removeItem('user_location');
    getCurrentUser.mockReturnValue({ location: { lat: 32.1, lng: 34.8 } });
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('place-order-btn')).not.toBeDisabled();
  });

  test('switching to pickup enables placing without a location', async () => {
    localStorage.removeItem('user_location');
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('tab', { name: /pickup/i }));
    expect(screen.getByTestId('place-order-btn')).not.toBeDisabled();
  });
});

describe('Checkout — delivery radius', () => {
  test('blocks delivery and offers pickup when the address is beyond 15 km', async () => {
    // User location is Tel Aviv (seeded); this restaurant is ~280 km away.
    getRestaurant.mockResolvedValue({ ...RESTAURANT, location: { lat: 29.55, lng: 34.95 } });
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');

    expect(screen.getByTestId('place-order-btn')).toBeDisabled();
    expect(screen.getByText(/beyond our 15 km delivery range/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /switch to pickup/i }));
    expect(screen.getByTestId('place-order-btn')).not.toBeDisabled();
  });

  test('allows delivery when the restaurant has no location to measure against', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('place-order-btn')).not.toBeDisabled();
    expect(screen.queryByText(/delivery range/i)).not.toBeInTheDocument();
  });

  test('surfaces the server "too far" 400 in the error banner', async () => {
    createOrder.mockRejectedValue(
      new Error('Delivery address is too far. Maximum delivery distance is 15km. (Your distance: 42.0km)')
    );
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByTestId('place-order-btn'));
    expect(await screen.findByText(/maximum delivery distance is 15km/i)).toBeInTheDocument();
  });
});

describe('Checkout — interactive extras', () => {
  test('promo code is typeable and always reported invalid', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    const input = screen.getByLabelText(/gift card or promo code/i);
    fireEvent.change(input, { target: { value: 'SAVE10' } });
    expect(input).toHaveValue('SAVE10');
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/isn't a valid or active code/i)).toBeInTheDocument();
  });

  test('Schedule reveals a time picker', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.queryByLabelText(/pick a delivery time/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /schedule/i }));
    expect(screen.getByLabelText(/pick a delivery time/i)).toBeInTheDocument();
  });

  test('How fees work reveals an explanation', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('button', { name: /how fees work/i }));
    expect(screen.getByText(/service fee helps us run the platform/i)).toBeInTheDocument();
  });
});

describe('Checkout — place order', () => {
  test('sends the full payload, clears the cart and shows the server receipt', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByTestId('place-order-btn'));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: '1',
          items: [
            { productId: 'i1', quantity: 2 },
            { productId: 'i2', quantity: 1 },
          ],
          mode: 'delivery',
          paymentMethod: 'card',
          cutlery: 0,
          location: { lat: 32.08, lng: 34.78 },
        })
      )
    );
    await waitFor(() => expect(localStorage.getItem('cart_1')).toBeNull());
    expect(await screen.findByText(/order accepted/i)).toBeInTheDocument();
    // Receipt shows the server-calculated total, not a client guess.
    expect(screen.getByText('₪121.00')).toBeInTheDocument();
  });

  test('cutlery is sent as a quantity, not a boolean', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    const more = screen.getByRole('button', { name: /more cutlery sets/i });
    fireEvent.click(more);
    fireEvent.click(more); // 2 sets
    fireEvent.click(screen.getByTestId('place-order-btn'));
    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ cutlery: 2 }))
    );
  });

  test('confirmation button navigates to /orders', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByTestId('place-order-btn'));
    fireEvent.click(await screen.findByRole('button', { name: /view my orders/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  test('shows an error and keeps the cart when the order fails', async () => {
    seedCart();
    createOrder.mockRejectedValue(new Error('Server exploded'));
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByTestId('place-order-btn'));

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
    expect(localStorage.getItem('cart_1')).not.toBeNull();
    expect(mockNavigate).not.toHaveBeenCalledWith('/orders');
  });

  test('disables the button while the order is in flight', async () => {
    seedCart();
    let resolveOrder;
    createOrder.mockReturnValue(new Promise((res) => { resolveOrder = res; }));
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    const btn = screen.getByTestId('place-order-btn');
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolveOrder(SERVER_ORDER);
    await screen.findByText(/order accepted/i);
  });
});
