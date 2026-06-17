import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Restaurant from './Restaurant';
import { getRestaurant, getMenu } from '../api/restaurants';

const mockUseParams = jest.fn(() => ({ id: '1' }));
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null, pathname: '/restaurant/1' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('../api/restaurants', () => ({
  getRestaurant: jest.fn(),
  getMenu: jest.fn(),
}));

jest.mock('../api/orders', () => ({
  getOrders: jest.fn(() => Promise.resolve([])),
  createOrder: jest.fn(),
}));

jest.mock('../components/AppBar', () =>
  ({ cartCount = 0, cartTotal = 0, onShowCart }) =>
    cartCount > 0
      ? <button onClick={onShowCart}>{cartCount} Show items ₪{cartTotal}</button>
      : <div data-testid="appbar" />
);

const RESTAURANT = {
  id: '1', name: 'Pizza Roma', category: 'Pizza',
  rating: 8.6, deliveryTime: '25–35 min', deliveryFee: 0,
};

const MENU = [
  {
    id: 'starters', title: 'Starters',
    items: [
      { id: 'i1', name: 'Garlic Bread', description: 'Toasted garlic bread', price: 24, image: '', maxQty: 5 },
      { id: 'i2', name: 'Arancini',     description: 'Fried risotto balls',  price: 36, image: '', maxQty: 3 },
    ],
  },
  {
    id: 'pizzas', title: 'Pizzas',
    items: [
      { id: 'i3', name: 'Margherita', description: 'Tomato and mozzarella', price: 62, image: '', maxQty: 10 },
    ],
  },
];

let intersectionCallback;

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: '1' });
  getRestaurant.mockResolvedValue(RESTAURANT);
  getMenu.mockResolvedValue(MENU);
  window.IntersectionObserver = jest.fn((cb) => {
    intersectionCallback = cb;
    return { observe: jest.fn(), disconnect: jest.fn() };
  });
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

function simulateHeroScrolledPast() {
  act(() => { intersectionCallback([{ isIntersecting: false }]); });
}

describe('Restaurant page — info', () => {
  test('renders restaurant name', async () => {
    render(<Restaurant />);
    expect(await screen.findByRole('heading', { name: /pizza roma/i })).toBeInTheDocument();
  });

  test('renders rating', async () => {
    render(<Restaurant />);
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/8\.6/)).toBeInTheDocument();
  });

  test('renders delivery time', async () => {
    render(<Restaurant />);
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/25.{0,3}35 min/i)).toBeInTheDocument();
  });

  test('shows Free delivery when deliveryFee is 0', async () => {
    render(<Restaurant />);
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/free delivery/i)).toBeInTheDocument();
  });

  test('shows fee amount when deliveryFee is non-zero', async () => {
    getRestaurant.mockResolvedValue({ ...RESTAURANT, deliveryFee: 9 });
    render(<Restaurant />);
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/₪9/)).toBeInTheDocument();
  });

  test('shows not-found when restaurant fetch fails', async () => {
    getRestaurant.mockRejectedValue(new Error('Not found'));
    render(<Restaurant />);
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});

describe('Restaurant page — menu', () => {
  test('renders menu section titles', async () => {
    render(<Restaurant />);
    expect(await screen.findByRole('heading', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pizzas/i })).toBeInTheDocument();
  });

  test('renders menu item names', async () => {
    render(<Restaurant />);
    expect(await screen.findByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
  });

  test('renders item prices', async () => {
    render(<Restaurant />);
    expect(await screen.findByText(/₪24/)).toBeInTheDocument();
    expect(screen.getByText(/₪62/)).toBeInTheDocument();
  });

  test('renders a category nav button for each section', async () => {
    render(<Restaurant />);
    expect(await screen.findByRole('button', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pizzas/i })).toBeInTheDocument();
  });
});

describe('Restaurant page — cart', () => {
  test('cart pill is not visible initially', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    expect(screen.queryByText(/show items/i)).not.toBeInTheDocument();
  });

  test('clicking + adds item and shows cart pill', async () => {
    render(<Restaurant />);
    fireEvent.click(await screen.findByRole('button', { name: /add garlic bread/i }));
    expect(screen.getByText(/show items/i)).toBeInTheDocument();
  });

  test('cart pill shows correct item count', async () => {
    render(<Restaurant />);
    const btn = await screen.findByRole('button', { name: /add garlic bread/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.getByText(/show items/i).closest('button')).toHaveTextContent('2');
  });

  test('cart pill shows total price', async () => {
    render(<Restaurant />);
    fireEvent.click(await screen.findByRole('button', { name: /add garlic bread/i }));
    expect(screen.getByText(/show items/i).closest('button')).toHaveTextContent('₪24');
  });

  test('+ button is disabled when item reaches maxQty', async () => {
    render(<Restaurant />);
    const btn = await screen.findByRole('button', { name: /add arancini/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });
});

describe('Restaurant page — in-restaurant search', () => {
  test('search input is visible as soon as the menu loads', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    expect(screen.getByPlaceholderText(/search menu/i)).toBeInTheDocument();
  });

  test('search input stays visible after the hero scrolls out of view', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    expect(screen.getByPlaceholderText(/search menu/i)).toBeInTheDocument();
  });

  test('typing in search filters menu items', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    userEvent.type(screen.getByPlaceholderText(/search menu/i), 'garlic');
    await waitFor(() => {
      expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
      expect(screen.queryByText('Margherita')).not.toBeInTheDocument();
      expect(screen.queryByText('Arancini')).not.toBeInTheDocument();
    });
  });

  test('search matches item description', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    userEvent.type(screen.getByPlaceholderText(/search menu/i), 'mozzarella');
    await waitFor(() => {
      expect(screen.getByText('Margherita')).toBeInTheDocument();
      expect(screen.queryByText('Garlic Bread')).not.toBeInTheDocument();
    });
  });

  test('sections with no matching items are hidden', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    userEvent.type(screen.getByPlaceholderText(/search menu/i), 'margherita');
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /starters/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /pizzas/i })).toBeInTheDocument();
    });
  });

  test('shows empty state message when no items match', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    userEvent.type(screen.getByPlaceholderText(/search menu/i), 'xyznotfound');
    await waitFor(() => {
      expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
  });

  test('clearing search restores all sections', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    const input = screen.getByPlaceholderText(/search menu/i);
    userEvent.type(input, 'garlic');
    await waitFor(() => expect(screen.queryByText('Margherita')).not.toBeInTheDocument());
    userEvent.clear(input);
    await waitFor(() => {
      expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
      expect(screen.getByText('Margherita')).toBeInTheDocument();
    });
  });

  test('search is case-insensitive', async () => {
    render(<Restaurant />);
    await screen.findByText('Garlic Bread');
    simulateHeroScrolledPast();
    userEvent.type(screen.getByPlaceholderText(/search menu/i), 'GARLIC');
    await waitFor(() => expect(screen.getByText('Garlic Bread')).toBeInTheDocument());
  });
});
