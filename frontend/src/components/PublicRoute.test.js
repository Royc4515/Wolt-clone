import { render, screen } from '@testing-library/react';
import PublicRoute from './PublicRoute';

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
}));

beforeEach(() => {
  localStorage.clear();
});

test('renders children when no token', () => {
  render(<PublicRoute><div>login form</div></PublicRoute>);
  expect(screen.getByText('login form')).toBeInTheDocument();
  expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
});

test('redirects to / when token exists', () => {
  localStorage.setItem('jwt_token', 'header.payload.signature');
  render(<PublicRoute><div>login form</div></PublicRoute>);
  expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  expect(screen.queryByText('login form')).not.toBeInTheDocument();
});
