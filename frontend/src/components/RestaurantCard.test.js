import { render, screen } from '@testing-library/react';
import RestaurantCard from './RestaurantCard';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}));

const baseProps = {
  id: '1',
  name: 'Pizza Roma',
  image: '',
  category: 'Pizza',
  rating: 4.5,
  deliveryTime: '25 min',
  isPromoted: false,
};

test('renders restaurant name', () => {
  render(<RestaurantCard {...baseProps} />);
  expect(screen.getByText('Pizza Roma')).toBeInTheDocument();
});

test('renders category', () => {
  render(<RestaurantCard {...baseProps} />);
  expect(screen.getByText('Pizza')).toBeInTheDocument();
});

test('renders rating', () => {
  render(<RestaurantCard {...baseProps} />);
  expect(screen.getByText(/4\.5/)).toBeInTheDocument();
});

test('renders delivery time', () => {
  render(<RestaurantCard {...baseProps} />);
  expect(screen.getByText('25 min')).toBeInTheDocument();
});

test('shows Promoted badge when isPromoted is true', () => {
  render(<RestaurantCard {...baseProps} isPromoted={true} />);
  expect(screen.getByText('Promoted')).toBeInTheDocument();
});

test('hides Promoted badge when isPromoted is false', () => {
  render(<RestaurantCard {...baseProps} isPromoted={false} />);
  expect(screen.queryByText('Promoted')).not.toBeInTheDocument();
});

test('links to /restaurant/:id', () => {
  render(<RestaurantCard {...baseProps} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/restaurant/1');
});
