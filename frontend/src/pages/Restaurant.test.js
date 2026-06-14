import { render, screen, fireEvent } from '@testing-library/react';
import Restaurant from './Restaurant';
import { getRestaurantById } from '../mocks/restaurants';
import { getMenu } from '../mocks/menu';

const mockUseParams = jest.fn(() => ({ id: '1' }));

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('../mocks/restaurants', () => ({ getRestaurantById: jest.fn() }));
jest.mock('../mocks/menu',        () => ({ getMenu: jest.fn() }));
jest.mock('../components/AppBar', () => () => <div />);
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
  getRestaurantById.mockReturnValue(MOCK_RESTAURANT);
  getMenu.mockReturnValue(MOCK_MENU);
});

afterEach(() => jest.clearAllMocks());

describe('Restaurant page', () => {
  test('renders restaurant name as heading', () => {
    renderRestaurant();
    expect(screen.getByRole('heading', { name: /pizza roma/i })).toBeInTheDocument();
  });

  test('renders restaurant rating', () => {
    renderRestaurant();
    expect(screen.getByText(/8\.6/)).toBeInTheDocument();
  });

  test('renders delivery time', () => {
    renderRestaurant();
    expect(screen.getByText(/25.{0,3}35 min/i)).toBeInTheDocument();
  });

  test('renders "Free delivery" when deliveryFee is 0', () => {
    renderRestaurant();
    expect(screen.getByText(/free delivery/i)).toBeInTheDocument();
  });

  test('renders delivery fee amount when non-zero', () => {
    getRestaurantById.mockReturnValue({ ...MOCK_RESTAURANT, deliveryFee: 9 });
    renderRestaurant();
    expect(screen.getByText(/₪9/)).toBeInTheDocument();
  });

  test('shows not-found message for unknown restaurant', () => {
    getRestaurantById.mockReturnValue(null);
    mockUseParams.mockReturnValue({ id: '999' });
    renderRestaurant();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  test('renders menu section titles', () => {
    renderRestaurant();
    expect(screen.getByRole('heading', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /pizzas/i })).toBeInTheDocument();
  });

  test('renders menu item names', () => {
    renderRestaurant();
    expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
  });

  test('renders menu item prices', () => {
    renderRestaurant();
    expect(screen.getByText(/₪24/)).toBeInTheDocument();
    expect(screen.getByText(/₪62/)).toBeInTheDocument();
  });

  test('CartBar is not visible initially', () => {
    renderRestaurant();
    expect(screen.queryByRole('region', { name: /cart/i })).not.toBeInTheDocument();
  });

  test('clicking "+" adds item and shows CartBar', () => {
    renderRestaurant();
    const addButton = screen.getByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addButton);
    expect(screen.getByRole('region', { name: /cart/i })).toBeInTheDocument();
  });

  test('CartBar shows correct item count', () => {
    renderRestaurant();
    const addBread = screen.getByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addBread);
    fireEvent.click(addBread);
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });

  test('CartBar shows total price', () => {
    renderRestaurant();
    const addBread = screen.getByRole('button', { name: /add garlic bread/i });
    fireEvent.click(addBread);
    // CartBar total shows ₪24
    const cartBar = screen.getByRole('region', { name: /cart/i });
    expect(cartBar).toHaveTextContent('₪24');
  });

  test('"+" button disabled when item is at maxQty', () => {
    renderRestaurant();
    const addArancini = screen.getByRole('button', { name: /add arancini/i });
    fireEvent.click(addArancini); // qty 1
    fireEvent.click(addArancini); // qty 2
    fireEvent.click(addArancini); // qty 3 (max)
    expect(addArancini).toBeDisabled();
  });

  test('category nav renders a button for each section', () => {
    renderRestaurant();
    expect(screen.getByRole('button', { name: /starters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pizzas/i })).toBeInTheDocument();
  });
});
