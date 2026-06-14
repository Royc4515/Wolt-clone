import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
}));

beforeEach(() => {
  localStorage.clear();
});

test('redirects to /login when no token', () => {
  render(<ProtectedRoute><div>secret</div></ProtectedRoute>);
  expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  expect(screen.queryByText('secret')).not.toBeInTheDocument();
});

test('renders children when token exists', () => {
  localStorage.setItem('jwt_token', 'header.payload.signature');
  render(<ProtectedRoute><div>secret</div></ProtectedRoute>);
  expect(screen.getByText('secret')).toBeInTheDocument();
  expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
});
