import { render, screen, fireEvent } from '@testing-library/react';
import CartDrawer from './CartDrawer';

const ITEMS = [
  { item: { id: 'i1', name: 'Margherita', price: 62, image: '' }, qty: 1 },
];

const SUGGESTIONS = [
  { id: 's1', name: 'Tiramisu', price: 30, image: '' },
  { id: 's2', name: 'Lemonade', price: 12, image: '' },
];

const baseProps = {
  items: ITEMS,
  count: 1,
  total: 62,
  onClose: jest.fn(),
  onCheckout: jest.fn(),
  onUpdateQty: jest.fn(),
};

afterEach(() => jest.clearAllMocks());

describe('CartDrawer — suggested add-ons', () => {
  test('renders the suggestions section when suggestions are provided', () => {
    render(<CartDrawer {...baseProps} suggestions={SUGGESTIONS} onAddSuggestion={jest.fn()} />);
    expect(screen.getByRole('heading', { name: /suggested add-ons/i })).toBeInTheDocument();
    expect(screen.getByText('Tiramisu')).toBeInTheDocument();
    expect(screen.getByText('Lemonade')).toBeInTheDocument();
  });

  test('does not render the section when no suggestions are passed', () => {
    render(<CartDrawer {...baseProps} />);
    expect(screen.queryByRole('heading', { name: /suggested add-ons/i })).not.toBeInTheDocument();
  });

  test('does not render the section when suggestions is an empty list', () => {
    render(<CartDrawer {...baseProps} suggestions={[]} onAddSuggestion={jest.fn()} />);
    expect(screen.queryByRole('heading', { name: /suggested add-ons/i })).not.toBeInTheDocument();
  });

  test('clicking add calls onAddSuggestion with the suggested item', () => {
    const onAddSuggestion = jest.fn();
    render(<CartDrawer {...baseProps} suggestions={SUGGESTIONS} onAddSuggestion={onAddSuggestion} />);
    fireEvent.click(screen.getByRole('button', { name: /add tiramisu/i }));
    expect(onAddSuggestion).toHaveBeenCalledWith(SUGGESTIONS[0]);
  });
});
