import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestaurantForm from './RestaurantForm';
import { createRestaurant } from '../../api/restaurants';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({}), // no id → create mode
  useNavigate: () => mockNavigate,
}));
jest.mock('../../api/restaurants', () => ({
  getRestaurant: jest.fn(),
  createRestaurant: jest.fn(() => Promise.resolve({ id: 'new1' })),
  updateRestaurant: jest.fn(),
}));
jest.mock('../../components/AppBar', () => () => <div data-testid="appbar" />);

beforeEach(() => {
  createRestaurant.mockResolvedValue({ id: 'new1' });
});
afterEach(() => jest.clearAllMocks());

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('RestaurantForm (create)', () => {
  test('blocks submit and shows errors when required fields are empty', async () => {
    render(<RestaurantForm />);
    fireEvent.click(screen.getByRole('button', { name: /create restaurant/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createRestaurant).not.toHaveBeenCalled();
  });

  test('creates a restaurant and navigates to its menu', async () => {
    render(<RestaurantForm />);
    fill('Name', 'Test Diner');
    fill('Category', 'Burgers');
    fill('Latitude', '32.08');
    fill('Longitude', '34.78');
    fill('Delivery fee (₪)', '5');
    fireEvent.click(screen.getByRole('button', { name: /create restaurant/i }));

    await waitFor(() =>
      expect(createRestaurant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Diner',
          category: 'Burgers',
          location: { lat: 32.08, lng: 34.78 },
          deliveryFee: 5,
        })
      )
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/restaurants/new1/menu'));
  });
});
