import { render, screen, fireEvent } from '@testing-library/react';
import AdminOrderCard from './AdminOrderCard';

// AdminOrderCard renders an <li>; mount it inside a <ul> for valid DOM nesting.
const Ul = ({ children }) => <ul>{children}</ul>;

const ORDER = {
  id: 'o1',
  mode: 'delivery',
  status: 'pending',
  items: [
    { productId: 'p1', quantity: 2 },
    { productId: 'p2', quantity: 1 },
  ],
  pricing: { total: 121 },
  createdAt: '2026-06-22T10:00:00.000Z',
};

const menuMap = new Map([
  ['p1', { id: 'p1', name: 'Garlic Bread' }],
  ['p2', { id: 'p2', name: 'Margherita' }],
]);

test('shows item names with quantities, total and mode', () => {
  render(<AdminOrderCard order={ORDER} menuMap={menuMap} onStatusChange={() => {}} />, { wrapper: Ul });
  expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
  expect(screen.getByText('×2')).toBeInTheDocument();
  expect(screen.getByText('Margherita')).toBeInTheDocument();
  expect(screen.getByText('₪121.00')).toBeInTheDocument();
  expect(screen.getByText('Delivery')).toBeInTheDocument();
});

test('falls back to the product id when it is not in the menu map', () => {
  render(
    <AdminOrderCard
      order={{ ...ORDER, items: [{ productId: 'ghost', quantity: 1 }] }}
      menuMap={menuMap}
      onStatusChange={() => {}}
    />,
    { wrapper: Ul }
  );
  expect(screen.getByText('ghost')).toBeInTheDocument();
});

test('renders an em dash when the total is missing', () => {
  render(
    <AdminOrderCard order={{ ...ORDER, pricing: undefined }} menuMap={menuMap} onStatusChange={() => {}} />,
    { wrapper: Ul }
  );
  expect(screen.getByText('—')).toBeInTheDocument();
});

test('forwards a status change with the order id', () => {
  const onStatusChange = jest.fn();
  render(<AdminOrderCard order={ORDER} menuMap={menuMap} onStatusChange={onStatusChange} />, { wrapper: Ul });
  fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
  expect(onStatusChange).toHaveBeenCalledWith('o1', 'delivered');
});
