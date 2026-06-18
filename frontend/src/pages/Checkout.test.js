import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Checkout from './Checkout';
import { getRestaurant } from '../api/restaurants';
import { createOrder } from '../api/orders';
import { isAuthenticated } from '../utils/auth';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => ({ restaurantId: '1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>,
}));

jest.mock('../api/restaurants', () => ({ getRestaurant: jest.fn() }));

jest.mock('../api/orders', () => ({
  createOrder: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/auth', () => ({
  isAuthenticated: jest.fn(() => true),
  USER_LOCATION_KEY: 'user_location',
}));

jest.mock('../components/AppBar', () => () => <div data-testid="appbar" />);

const RESTAURANT = { id: '1', name: 'Pizza Roma', deliveryFee: 9, deliveryTime: '25–35 min' };

const CART = [
  { item: { id: 'i1', name: 'Garlic Bread', price: 24, image: '', maxQty: 5 }, qty: 2 },
  { item: { id: 'i2', name: 'Margherita', price: 62, image: '', maxQty: 5 }, qty: 1 },
];

const seedCart = (items = CART) => localStorage.setItem('cart_1', JSON.stringify(items));
const seedLocation = () => localStorage.setItem('user_location', JSON.stringify({ lat: 32.08, lng: 34.78 }));

beforeEach(() => {
  getRestaurant.mockResolvedValue(RESTAURANT);
  createOrder.mockResolvedValue();
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

describe('Checkout — summary & totals', () => {
  test('renders each item with its unit price', async () => {
    seedCart();
    render(<Checkout />);
    expect(await screen.findByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
    expect(screen.getByText('₪24.00')).toBeInTheDocument();
    expect(screen.getByText('₪62.00')).toBeInTheDocument();
  });

  test('breaks down subtotal, service fee, delivery and total', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByTestId('checkout-subtotal')).toHaveTextContent('₪110.00');
    expect(screen.getByTestId('checkout-service-fee')).toHaveTextContent('₪5.90');
    expect(screen.getByTestId('checkout-delivery-fee')).toHaveTextContent('₪9.00');
    // 110 + 5.90 + 9 = 124.90
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪124.90');
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
  test('pickup drops service & delivery fees, total equals subtotal', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('tab', { name: /pickup/i }));
    expect(screen.queryByTestId('checkout-delivery-fee')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checkout-service-fee')).not.toBeInTheDocument();
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪110.00');
  });
});

describe('Checkout — tip', () => {
  test('selecting a tip adds it to the total', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByRole('button', { name: '₪10' }));
    expect(screen.getByTestId('checkout-tip')).toHaveTextContent('₪10.00');
    // 124.90 + 10 = 134.90
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₪134.90');
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
  test('prompts to set a location but still allows placing the order', async () => {
    localStorage.removeItem('user_location');
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByText(/add a delivery location/i)).toBeInTheDocument();
    expect(screen.getByTestId('place-order-btn')).not.toBeDisabled();
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
  test('creates the order, clears the cart and shows confirmation', async () => {
    seedCart();
    render(<Checkout />);
    await screen.findByText('Garlic Bread');
    fireEvent.click(screen.getByTestId('place-order-btn'));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith('1', [
        { productId: 'i1', quantity: 2 },
        { productId: 'i2', quantity: 1 },
      ])
    );
    await waitFor(() => expect(localStorage.getItem('cart_1')).toBeNull());
    expect(await screen.findByText(/order accepted/i)).toBeInTheDocument();
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
    resolveOrder();
    await screen.findByText(/order accepted/i);
  });
});
