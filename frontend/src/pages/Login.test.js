import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  MemoryRouter: ({ children }) => <>{children}</>,
}));

jest.mock('../services/auth', () => ({ login: jest.fn() }));
jest.mock('../utils/validation', () => ({ validatePassword: jest.fn(() => null) }));
jest.mock('../components/shared/ThemeToggle', () => () => <div />);

const { login } = require('../services/auth');
const { validatePassword } = require('../utils/validation');

const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

beforeEach(() => jest.clearAllMocks());

describe('Login', () => {
  it('focuses username input on mount', () => {
    renderLogin();
    expect(document.activeElement).toBe(screen.getByPlaceholderText('your_username'));
  });

  it('shows hint text under username field initially', () => {
    renderLogin();
    expect(screen.getByText(/3.20 characters/i)).toBeInTheDocument();
  });

  it('shows hint text under password field initially', () => {
    renderLogin();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows username error when submitting empty username', () => {
    renderLogin();
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('shows password error when validatePassword returns an error', () => {
    validatePassword.mockReturnValue('Password is required');
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('clears username error when user types in username field', () => {
    renderLogin();
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'a' } });
    expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
  });

  it('clears server error when user types in any field', async () => {
    login.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText('Invalid credentials');
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'x' } });
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });

  it('calls login with correct username and password', async () => {
    login.mockResolvedValue({});
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('validuser', 'validpass1'));
  });

  it('shows loading text on submit button during API call', async () => {
    login.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Signing in…')).toBeInTheDocument();
  });

  it('disables submit button during API call', async () => {
    login.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('navigates to / on successful login', async () => {
    login.mockResolvedValue({});
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows server error banner with is-visible class on login failure', async () => {
    login.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('your_username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'validpass1' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText('Invalid credentials');
    expect(screen.getByRole('alert')).toHaveClass('is-visible');
  });
});
