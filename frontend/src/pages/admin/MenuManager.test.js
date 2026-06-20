import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MenuManager from './MenuManager';
import { getRestaurant } from '../../api/restaurants';
import { getProducts, createProduct, deleteProduct } from '../../api/products';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'r1' }),
  useNavigate: () => jest.fn(),
}));
jest.mock('../../api/restaurants', () => ({ getRestaurant: jest.fn() }));
jest.mock('../../api/products', () => ({
  getProducts: jest.fn(),
  createProduct: jest.fn(() => Promise.resolve({ id: 'p9' })),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../components/AppBar', () => () => <div data-testid="appbar" />);

const ITEMS = [
  { id: 'p1', name: 'Margherita', price: 62, section: 'Pizzas', isAvailable: true },
];

beforeEach(() => {
  getRestaurant.mockResolvedValue({ id: 'r1', name: 'Pizza Roma' });
  getProducts.mockResolvedValue(ITEMS);
  createProduct.mockResolvedValue({ id: 'p9' });
  deleteProduct.mockResolvedValue();
});
afterEach(() => jest.clearAllMocks());

describe('MenuManager', () => {
  test('lists existing menu items', async () => {
    render(<MenuManager />);
    expect(await screen.findByText('Margherita')).toBeInTheDocument();
    expect(screen.getByText(/Pizzas · ₪62/)).toBeInTheDocument();
  });

  test('adds an item with name, price and section', async () => {
    render(<MenuManager />);
    await screen.findByText('Margherita');
    fireEvent.click(screen.getByRole('button', { name: /add item/i }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Garlic Bread' } });
    fireEvent.change(screen.getByLabelText('Price (₪)'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('Section'), { target: { value: 'Starters' } });
    fireEvent.click(screen.getByRole('button', { name: /^add item$/i }));

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ name: 'Garlic Bread', price: 24, section: 'Starters' })
      )
    );
  });

  test('deletes a menu item', async () => {
    render(<MenuManager />);
    await screen.findByText('Margherita');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith('r1', 'p1'));
  });
});
