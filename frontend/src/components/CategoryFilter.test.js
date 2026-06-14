import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from './CategoryFilter';

const categories = [
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Sushi', emoji: '🍣' },
  { name: 'Burgers', emoji: '🍔' },
];

test('renders All card', () => {
  render(<CategoryFilter categories={categories} active={null} onSelect={() => {}} />);
  expect(screen.getByText('All')).toBeInTheDocument();
});

test('renders a card for each category', () => {
  render(<CategoryFilter categories={categories} active={null} onSelect={() => {}} />);
  categories.forEach(cat => {
    expect(screen.getByText(cat.name)).toBeInTheDocument();
  });
});

test('All card is active when active is null', () => {
  render(<CategoryFilter categories={categories} active={null} onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
});

test('category card is active when it matches active prop', () => {
  render(<CategoryFilter categories={categories} active="Pizza" onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: 'Pizza' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
});

test('calls onSelect with null when All is clicked', async () => {
  const onSelect = jest.fn();
  render(<CategoryFilter categories={categories} active="Pizza" onSelect={onSelect} />);
  await userEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(onSelect).toHaveBeenCalledWith(null);
});

test('calls onSelect with category name when card is clicked', async () => {
  const onSelect = jest.fn();
  render(<CategoryFilter categories={categories} active={null} onSelect={onSelect} />);
  await userEvent.click(screen.getByRole('button', { name: 'Sushi' }));
  expect(onSelect).toHaveBeenCalledWith('Sushi');
});
