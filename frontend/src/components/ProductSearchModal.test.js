import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductSearchModal from './ProductSearchModal';
import { getRestaurant } from '../api/restaurants';

const mockNavigate = jest.fn();

jest.mock('../api/restaurants');
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const PRODUCT = {
  id: 'p1',
  name: 'Cheeseburger',
  price: 48,
  description: '200g beef patty with cheese',
  image: '',
  restId: 'r1',
};

const RESTAURANT = {
  id: 'r1',
  name: 'Burger Palace',
  image: '',
  rating: 8.5,
  deliveryTime: '30-40 min',
  deliveryFee: 5,
};

function renderModal(props = {}) {
  return render(
    <ProductSearchModal product={PRODUCT} onClose={jest.fn()} {...props} />
  );
}

beforeEach(() => {
  getRestaurant.mockResolvedValue(RESTAURANT);
});
afterEach(() => jest.clearAllMocks());

describe('ProductSearchModal — product info', () => {
  test('shows product name', () => {
    renderModal();
    expect(screen.getByText('Cheeseburger')).toBeInTheDocument();
  });

  test('shows formatted price with shekel symbol', () => {
    renderModal();
    expect(screen.getByText('₪48.00')).toBeInTheDocument();
  });

  test('shows product description', () => {
    renderModal();
    expect(screen.getByText('200g beef patty with cheese')).toBeInTheDocument();
  });

  test('does not crash when price is missing', async () => {
    await act(async () => {
      render(<ProductSearchModal product={{ ...PRODUCT, price: undefined }} onClose={jest.fn()} />);
    });
    expect(screen.getByText('Cheeseburger')).toBeInTheDocument();
  });
});

describe('ProductSearchModal — restaurant card', () => {
  test('shows loading text while restaurant is fetching', async () => {
    getRestaurant.mockReturnValue(new Promise(() => {}));
    await act(async () => { renderModal(); });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('shows restaurant name after fetch resolves', async () => {
    renderModal();
    expect(await screen.findByText('Burger Palace')).toBeInTheDocument();
  });

  test('shows restaurant rating', async () => {
    renderModal();
    await screen.findByText('Burger Palace');
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  test('shows delivery time', async () => {
    renderModal();
    await screen.findByText('Burger Palace');
    expect(screen.getByText('30-40 min')).toBeInTheDocument();
  });

  test('shows delivery fee', async () => {
    renderModal();
    await screen.findByText('Burger Palace');
    expect(screen.getByText('₪5')).toBeInTheDocument();
  });

  test('calls getRestaurant with product.restId', async () => {
    renderModal();
    await screen.findByText('Burger Palace');
    expect(getRestaurant).toHaveBeenCalledWith('r1');
  });
});

describe('ProductSearchModal — Start ordering', () => {
  test('navigates to restaurant with reorderItems containing the product', async () => {
    renderModal();
    await screen.findByText('Burger Palace');
    userEvent.click(screen.getByRole('button', { name: /start ordering/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/restaurant/r1', {
        state: { reorderItems: [{ productId: 'p1', quantity: 1 }] },
      });
    });
  });

  test('calls onClose after navigating', async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    await screen.findByText('Burger Palace');
    userEvent.click(screen.getByRole('button', { name: /start ordering/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('ProductSearchModal — restaurant card navigation', () => {
  test('clicking restaurant card navigates to restaurant page', async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    await screen.findByText('Burger Palace');
    userEvent.click(screen.getByRole('button', { name: /burger palace/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/restaurant/r1');
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('ProductSearchModal — close behaviors', () => {
  test('pressing Escape calls onClose', async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('clicking the overlay background calls onClose', async () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    const overlay = document.querySelector('.psm__overlay');
    fireEvent.click(overlay);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('clicking the X button calls onClose', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
