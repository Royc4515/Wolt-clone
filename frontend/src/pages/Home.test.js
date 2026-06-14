import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}));

jest.mock('../components/shared/ThemeToggle', () => () => <div />);

test('renders promoted section heading', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { name: 'Promoted' })).toBeInTheDocument();
});

test('renders All Restaurants section heading', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { name: 'All Restaurants' })).toBeInTheDocument();
});

test('renders restaurant cards', () => {
  render(<Home />);
  expect(screen.getAllByText('Pizza Roma').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Sushi Bar TLV').length).toBeGreaterThan(0);
});

test('renders search input', () => {
  render(<Home />);
  expect(screen.getByRole('searchbox')).toBeInTheDocument();
});

test('searching filters restaurants', async () => {
  render(<Home />);
  await userEvent.type(screen.getByRole('searchbox'), 'pizza');
  expect(screen.getByRole('heading', { name: /Results for "pizza"/i })).toBeInTheDocument();
  expect(screen.getByText('Pizza Roma')).toBeInTheDocument();
  expect(screen.queryByText('Sushi Bar TLV')).not.toBeInTheDocument();
});

test('shows no results message when search has no matches', async () => {
  render(<Home />);
  await userEvent.type(screen.getByRole('searchbox'), 'xyznotfound');
  expect(screen.getByRole('heading', { name: /No results for/i })).toBeInTheDocument();
});

test('clicking a category filters restaurants', async () => {
  render(<Home />);
  await userEvent.click(screen.getByRole('button', { name: 'Sushi' }));
  expect(screen.getByText('Sushi Bar TLV')).toBeInTheDocument();
  expect(screen.queryByText('Pizza Roma')).not.toBeInTheDocument();
});

test('category section heading updates when category selected', async () => {
  render(<Home />);
  await userEvent.click(screen.getByRole('button', { name: 'Sushi' }));
  expect(screen.getByRole('heading', { name: 'Sushi' })).toBeInTheDocument();
});
