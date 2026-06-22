import { render, screen, fireEvent } from '@testing-library/react';
import OrderStatusControl from './OrderStatusControl';

test('renders the three lifecycle steps', () => {
  render(<OrderStatusControl status="pending" onChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Preparing' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delivered' })).toBeInTheDocument();
});

test('marks the current status and disables it', () => {
  render(<OrderStatusControl status="preparing" onChange={() => {}} />);
  const current = screen.getByRole('button', { name: 'Preparing' });
  expect(current).toHaveAttribute('aria-pressed', 'true');
  expect(current).toBeDisabled();
});

test('calls onChange with the chosen step', () => {
  const onChange = jest.fn();
  render(<OrderStatusControl status="pending" onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
  expect(onChange).toHaveBeenCalledWith('delivered');
});

test('disables every step while an update is in flight', () => {
  render(<OrderStatusControl status="pending" onChange={() => {}} updating />);
  ['Pending', 'Preparing', 'Delivered'].forEach((name) => {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  });
});
