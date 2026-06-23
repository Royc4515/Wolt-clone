import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from './Home';
import { getRestaurants, getRecommendedRestaurants } from '../api/restaurants';

jest.mock('../api/restaurants');
jest.mock('../components/AppBar', () => () => <div data-testid="appbar" />);
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}));

const RESTAURANTS = [
  { id: '1', name: 'Pizza Roma',    category: 'Pizza',   isPromoted: true,  image: '' },
  { id: '2', name: 'Sushi Bar TLV', category: 'Sushi',   isPromoted: false, image: '' },
  { id: '3', name: 'Burger King',   category: 'Burgers', isPromoted: false, image: '' },
];

const RECOMMENDED = [
  { id: '9', name: 'Recommended Spot', category: 'Pizza', isPromoted: false, image: '' },
];

// A structurally-valid JWT (header.payload.signature) whose payload decodes to a
// user object — enough for isAuthenticated() to treat the session as logged in.
const FAKE_JWT = `x.${btoa(JSON.stringify({ id: 'u1' }))}.y`;
const login = () => localStorage.setItem('jwt_token', FAKE_JWT);

beforeEach(() => {
  getRestaurants.mockResolvedValue(RESTAURANTS);
  getRecommendedRestaurants.mockResolvedValue([]);
});
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('renders AppBar', () => {
  render(<Home />);
  expect(screen.getByTestId('appbar')).toBeInTheDocument();
});

test('renders All Restaurants section heading', async () => {
  render(<Home />);
  expect(await screen.findByRole('heading', { name: 'All Restaurants' })).toBeInTheDocument();
});

test('renders Promoted section when promoted restaurants exist', async () => {
  render(<Home />);
  expect(await screen.findByRole('heading', { name: 'Promoted' })).toBeInTheDocument();
});

test('does not render Promoted section when no restaurants are promoted', async () => {
  getRestaurants.mockResolvedValue([
    { id: '1', name: 'Sushi Bar', category: 'Sushi', isPromoted: false, image: '' },
  ]);
  render(<Home />);
  await screen.findByText('Sushi Bar');
  expect(screen.queryByRole('heading', { name: 'Promoted' })).not.toBeInTheDocument();
});

test('renders restaurant cards returned by the API', async () => {
  render(<Home />);
  // Sushi Bar TLV is not promoted so it only appears once — safe to use getBy
  expect(await screen.findByText('Sushi Bar TLV')).toBeInTheDocument();
  // Pizza Roma is promoted so it appears in both Promoted + All sections
  expect(screen.getAllByText('Pizza Roma').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Burger King')).toBeInTheDocument();
});

test('category filter shows only restaurants in selected category', async () => {
  render(<Home />);
  const sushiBtn = await screen.findByRole('button', { name: 'Sushi' });
  fireEvent.click(sushiBtn);
  await waitFor(() => {
    expect(screen.getByText('Sushi Bar TLV')).toBeInTheDocument();
    expect(screen.queryByText('Pizza Roma')).not.toBeInTheDocument();
  });
});

test('section heading updates to selected category name', async () => {
  render(<Home />);
  const pizzaBtn = await screen.findByRole('button', { name: 'Pizza' });
  fireEvent.click(pizzaBtn);
  expect(await screen.findByRole('heading', { name: 'Pizza' })).toBeInTheDocument();
});

test('handles API error without crashing', async () => {
  getRestaurants.mockRejectedValue(new Error('Network error'));
  render(<Home />);
  expect(await screen.findByRole('heading', { name: 'All Restaurants' })).toBeInTheDocument();
});

test('category buttons are rendered for each unique category', async () => {
  render(<Home />);
  expect(await screen.findByRole('button', { name: 'Pizza' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sushi' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Burgers' })).toBeInTheDocument();
});

test('passes the saved user location as coords to getRestaurants', async () => {
  localStorage.setItem('user_location', JSON.stringify({ lat: 32.08, lng: 34.78 }));
  render(<Home />);
  await screen.findByRole('heading', { name: 'All Restaurants' });
  expect(getRestaurants).toHaveBeenCalledWith({ lat: 32.08, lng: 34.78 });
});

test('requests the full list (no coords) when there is no saved location', async () => {
  render(<Home />);
  await screen.findByRole('heading', { name: 'All Restaurants' });
  expect(getRestaurants).toHaveBeenCalledWith(undefined);
});

describe('Recommended for you', () => {
  test('renders the carousel for a logged-in user when recommendations exist', async () => {
    login();
    getRecommendedRestaurants.mockResolvedValue(RECOMMENDED);
    render(<Home />);
    expect(await screen.findByRole('heading', { name: 'Recommended for you' })).toBeInTheDocument();
    expect(screen.getByText('Recommended Spot')).toBeInTheDocument();
  });

  test('forwards the saved location so recommendations honour the delivery radius', async () => {
    login();
    localStorage.setItem('user_location', JSON.stringify({ lat: 32.08, lng: 34.78 }));
    getRecommendedRestaurants.mockResolvedValue(RECOMMENDED);
    render(<Home />);
    await screen.findByRole('heading', { name: 'Recommended for you' });
    expect(getRecommendedRestaurants).toHaveBeenCalledWith({ lat: 32.08, lng: 34.78 });
  });

  test('does not call the endpoint or render the section for guests', async () => {
    render(<Home />);
    await screen.findByRole('heading', { name: 'All Restaurants' });
    expect(getRecommendedRestaurants).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Recommended for you' })).not.toBeInTheDocument();
  });

  test('hides the section when the endpoint returns an empty list', async () => {
    login();
    getRecommendedRestaurants.mockResolvedValue([]);
    render(<Home />);
    await screen.findByRole('heading', { name: 'All Restaurants' });
    expect(screen.queryByRole('heading', { name: 'Recommended for you' })).not.toBeInTheDocument();
  });

  test('hides the section (no crash) when the fetch fails', async () => {
    login();
    getRecommendedRestaurants.mockRejectedValue(new Error('500'));
    render(<Home />);
    await screen.findByRole('heading', { name: 'All Restaurants' });
    expect(screen.queryByRole('heading', { name: 'Recommended for you' })).not.toBeInTheDocument();
  });

  test('hides the section while a category filter is active', async () => {
    login();
    getRecommendedRestaurants.mockResolvedValue(RECOMMENDED);
    render(<Home />);
    await screen.findByRole('heading', { name: 'Recommended for you' });
    fireEvent.click(screen.getByRole('button', { name: 'Sushi' }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Recommended for you' })).not.toBeInTheDocument();
    });
  });
});
