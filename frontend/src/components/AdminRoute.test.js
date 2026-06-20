import { render, screen } from '@testing-library/react';
import AdminRoute from './AdminRoute';
import { isAuthenticated, isAdmin } from '../utils/auth';

jest.mock('react-router-dom', () => ({ Navigate: ({ to }) => <div>redirect:{to}</div> }));
jest.mock('../utils/auth', () => ({ isAuthenticated: jest.fn(), isAdmin: jest.fn() }));

afterEach(() => jest.clearAllMocks());

describe('AdminRoute', () => {
  test('renders children for an admin', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(true);
    render(<AdminRoute><div>secret</div></AdminRoute>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  test('redirects to /login when logged out', () => {
    isAuthenticated.mockReturnValue(false);
    isAdmin.mockReturnValue(false);
    render(<AdminRoute><div>secret</div></AdminRoute>);
    expect(screen.getByText('redirect:/login')).toBeInTheDocument();
  });

  test('redirects home for a non-admin', () => {
    isAuthenticated.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    render(<AdminRoute><div>secret</div></AdminRoute>);
    expect(screen.getByText('redirect:/')).toBeInTheDocument();
  });
});
