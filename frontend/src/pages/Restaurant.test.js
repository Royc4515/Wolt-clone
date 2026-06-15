import { render, screen, fireEvent } from '@testing-library/react';
import Restaurant from './Restaurant';
import { fetchRestaurant, fetchMenu } from '../api/restaurants';

const mockUseParams = jest.fn(() => ({ id: '1' }));
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('../api/restaurants', () => ({
  fetchRestaurant: jest.fn(),
  fetchMenu: jest.fn(),
}));

jest.mock('../components/AppBar', () =>
  ({ cartCount = 0, cartTotal = 0, onShowCart }) =>
    cartCount > 0
      ? <button onClick={onShowCart}>{cartCount} Show items ₪{cartTotal}</button>
      : <div />
);

jest.mock('../components/shared/ThemeToggle', () => () => <div />);

const MOCK_RESTAURANT = {
  id: '1', name: 'Pizza Roma', category: 'Pizza',
  rating: 8.6, deliveryTime: '25–35 min', deliveryFee: 0,
};

const MOCK_MENU = [
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

function renderRestaurant() {
  return render(<Restaurant />);
}

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: '1' });
  fetchRestaurant.mockResolvedValue(MOCK_RESTAURANT);
  fetchMenu.mockResolvedValue(MOCK_MENU);
  localStorage.setItem('jwt_token', 'a.valid.token');
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Restaurant page', () => {
  test('renders restaurant name as heading', async () => {
    renderRestaurant();
    expect(await screen.findByRole('heading', { name: /pizza roma/i })).toBeInTheDocument();
  });

  test('renders restaurant rating', async () => {
    renderRestaurant();
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/8\.6/)).toBeInTheDocument();
  });

  test('renders delivery time', async () => {
    renderRestaurant();
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/25.{0,3}35 min/i)).toBeInTheDocument();
  });

  test('renders "Free delivery" when deliveryFee is 0', async () => {
    renderRestaurant();
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/free delivery/i)).toBeInTheDocument();
  });

  test('renders delivery fee amount when non-zero', async () => {
    fetchRestaurant.mockResolvedValue({ ...MOCK_RESTAURANT, deliveryFee: 9 });
    renderRestaurant();
    await screen.findByRole('heading', { name: /pizza roma/i });
    expect(screen.getByText(/₪9/)).toBeInTheDocument();
  });

  test('shows not-found message for unknown restaurant', async () => {
    fetchRestaurant.mockRejectedValue(new Error('Not found'));
    mockUseParams.mockReturnValue({ id: '999' });
    renderRestaurant();
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  test('renders menu section titles', async () => {
    renderRestaurant();
    expect(await screen.findByRole('heading', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pizzas/i })).toBeInTheDocument();
  });

  test('renders menu item names', async () => {
    renderRestaurant();
    expect(await screen.findByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
  });

  test('renders menu item prices', async () => {
    renderRestaurant();
    expect(await screen.findByText(/₪24/)).toBeInTheDocument();
    expect(screen.getByText(/₪62/)).toBeInTheDocument();
  });

  test('cart pill is not visible initially', async () => {
    renderRestaurant();
    await screen.findByText('Garlic Bread');
    expect(screen.queryByText(/show items/i)).not.toBeInTheDocument();
  });

  test('clicking "+" adds item and shows cart pill', async () => {
    renderRestaurant();
    const addButton = await screen.findByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addButton);
    expect(screen.getByText(/show items/i)).toBeInTheDocument();
  });

  test('cart pill shows correct item count', async () => {
    renderRestaurant();
    const addBread = await screen.findByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addBread);
    fireEvent.click(addBread);
    const pill = screen.getByText(/show items/i).closest('button');
    expect(pill).toHaveTextContent('2');
  });

  test('cart pill shows total price', async () => {
    renderRestaurant();
    const addBread = await screen.findByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addBread);
    const pill = screen.getByText(/show items/i).closest('button');
    expect(pill).toHaveTextContent('₪24');
  });

  test('"+" button disabled when item is at maxQty', async () => {
    renderRestaurant();
    const addArancini = await screen.findByRole('button', { name: /add arancini/i });
    fireEvent.click(addArancini); // qty 1
    fireEvent.click(addArancini); // qty 2
    fireEvent.click(addArancini); // qty 3 (max)
    expect(addArancini).toBeDisabled();
  });

  test('category nav renders a button for each section', async () => {
    renderRestaurant();
    expect(await screen.findByRole('button', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pizzas/i })).toBeInTheDocument();
  });

  describe('auth guard on add', () => {
    test('clicking "+" when logged out redirects to /login', async () => {
      localStorage.clear();
      renderRestaurant();
      fireEvent.click(await screen.findByRole('button', { name: /add garlic bread/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('clicking "+" when logged out does not add item to cart', async () => {
      localStorage.clear();
      renderRestaurant();
      fireEvent.click(await screen.findByRole('button', { name: /add garlic bread/i }));
      expect(screen.queryByText(/show items/i)).not.toBeInTheDocument();
    });

    test('clicking "+" when logged in adds item normally', async () => {
      renderRestaurant();
      fireEvent.click(await screen.findByRole('button', { name: /add garlic bread/i }));
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByText(/show items/i)).toBeInTheDocument();
    });
  });
});
