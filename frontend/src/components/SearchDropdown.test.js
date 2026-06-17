import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchDropdown from './SearchDropdown';
import { searchAll } from '../api/search';

const mockNavigate = jest.fn();

jest.mock('../api/search');
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const MOCK_RESULTS = {
  restaurants: [{ id: 'r1', name: 'Burger Palace', category: 'Burgers', image: '' }],
  products: [
    { id: 'p1', name: 'Cheeseburger', restId: 'r1', restaurantName: 'Burger Palace', image: '' },
  ],
};

function renderDropdown(props = {}) {
  return render(
    <SearchDropdown
      query="burger"
      onProductClick={jest.fn()}
      onClose={jest.fn()}
      onQueryChange={jest.fn()}
      {...props}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  searchAll.mockResolvedValue(MOCK_RESULTS);
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  localStorage.clear();
});

describe('SearchDropdown — loading state', () => {
  test('shows loading text while debounce is pending or on first render', () => {
    renderDropdown();
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });

  test('hides loading text after results arrive', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => expect(screen.queryByText(/searching/i)).not.toBeInTheDocument());
  });
});

describe('SearchDropdown — results', () => {
  test('shows Restaurants section heading', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    expect(await screen.findByText('Restaurants and stores')).toBeInTheDocument();
  });

  test('shows restaurant name', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    const names = await screen.findAllByText('Burger Palace');
    expect(names.length).toBeGreaterThan(0);
  });

  test('shows Items section heading', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    expect(await screen.findByText('Related items')).toBeInTheDocument();
  });

  test('shows product name in items section', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    expect(await screen.findByText('Cheeseburger')).toBeInTheDocument();
  });

  test('shows restaurantName as subtitle under item', async () => {
    renderDropdown();
    await act(async () => { jest.runAllTimers(); });
    await screen.findByText('Cheeseburger');
    // restaurantName appears as sub-label under the item
    const subs = screen.getAllByText('Burger Palace');
    expect(subs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SearchDropdown — empty and no-query states', () => {
  test('shows no-results message when API returns empty', async () => {
    searchAll.mockResolvedValue({ restaurants: [], products: [] });
    renderDropdown({ query: 'xyznotfound' });
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() =>
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    );
  });

  test('does not call API and shows no loading/results for empty query', async () => {
    renderDropdown({ query: '' });
    await act(async () => { jest.runAllTimers(); });
    expect(searchAll).not.toHaveBeenCalled();
    expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument();
  });

  test('shows recent searches for empty query when localStorage has entries', async () => {
    localStorage.setItem('wolt_recent_searches', JSON.stringify(['pizza', 'sushi']));
    renderDropdown({ query: '' });
    await act(async () => { jest.runAllTimers(); });
    expect(await screen.findByText(/you recently searched/i)).toBeInTheDocument();
    expect(screen.getByText('pizza')).toBeInTheDocument();
    expect(screen.getByText('sushi')).toBeInTheDocument();
  });

  test('clicking a recent search calls onQueryChange with that term', async () => {
    localStorage.setItem('wolt_recent_searches', JSON.stringify(['burger']));
    const onQueryChange = jest.fn();
    renderDropdown({ query: '', onQueryChange });
    await act(async () => { jest.runAllTimers(); });
    await screen.findByText('burger');
    userEvent.click(screen.getByRole('button', { name: /burger/i }));
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledWith('burger'));
  });
});

describe('SearchDropdown — debounce', () => {
  test('does not call API before debounce fires', () => {
    renderDropdown({ query: 'pizza' });
    expect(searchAll).not.toHaveBeenCalled();
  });

  test('calls API with the query after debounce fires', async () => {
    renderDropdown({ query: 'pizza' });
    await act(async () => { jest.runAllTimers(); });
    expect(searchAll).toHaveBeenCalledWith('pizza');
    expect(searchAll).toHaveBeenCalledTimes(1);
  });
});

describe('SearchDropdown — interactions', () => {
  test('clicking a restaurant row navigates and calls onClose', async () => {
    const onClose = jest.fn();
    renderDropdown({ onClose });
    await act(async () => { jest.runAllTimers(); });
    await screen.findByText('Restaurants and stores');
    // First match is the restaurant card name (restaurants render before items).
    userEvent.click(screen.getAllByText('Burger Palace')[0].closest('button'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/restaurant/r1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('clicking a product row calls onProductClick with the product', async () => {
    const onProductClick = jest.fn();
    renderDropdown({ onProductClick });
    await act(async () => { jest.runAllTimers(); });
    await screen.findByText('Cheeseburger');
    userEvent.click(screen.getByRole('button', { name: /cheeseburger/i }));
    await waitFor(() => {
      expect(onProductClick).toHaveBeenCalledWith(MOCK_RESULTS.products[0]);
    });
  });
});
