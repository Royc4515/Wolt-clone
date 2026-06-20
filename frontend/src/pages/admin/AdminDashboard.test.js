import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { getRestaurants, deleteRestaurant } from '../../api/restaurants';
import { getCurrentUser } from '../../utils/auth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('../../api/restaurants', () => ({ getRestaurants: jest.fn(), deleteRestaurant: jest.fn() }));
jest.mock('../../utils/auth', () => ({ getCurrentUser: jest.fn() }));
jest.mock('../../components/AppBar', () => () => <div data-testid="appbar" />);

const ALL = [
  { id: 'r1', name: 'My Pizza', category: 'Pizza', ownerId: 'u1' },
  { id: 'r2', name: 'Someone Else', category: 'Sushi', ownerId: 'u2' },
];

beforeEach(() => {
  getCurrentUser.mockReturnValue({ id: 'u1' });
  getRestaurants.mockResolvedValue(ALL);
  deleteRestaurant.mockResolvedValue();
});
afterEach(() => jest.clearAllMocks());

describe('AdminDashboard', () => {
  test('lists only restaurants the admin owns', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText('My Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Someone Else')).not.toBeInTheDocument();
  });

  test('New restaurant navigates to the create form', async () => {
    render(<AdminDashboard />);
    await screen.findByText('My Pizza');
    fireEvent.click(screen.getByRole('button', { name: /new restaurant/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/restaurants/new');
  });

  test('deleting a restaurant removes it from the list', async () => {
    render(<AdminDashboard />);
    await screen.findByText('My Pizza');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(deleteRestaurant).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(screen.queryByText('My Pizza')).not.toBeInTheDocument());
  });
});
