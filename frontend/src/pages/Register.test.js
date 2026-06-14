import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  MemoryRouter: ({ children }) => <>{children}</>,
}));

jest.mock('../services/auth', () => ({ register: jest.fn() }));
jest.mock('../utils/validation', () => ({
  validateRegistration: jest.fn(() => ({ isValid: true, errors: {} })),
}));
jest.mock('../components/shared/ThemeToggle', () => () => <div />);

const { register } = require('../services/auth');
const { validateRegistration } = require('../utils/validation');

const mockReadAsDataURL = jest.fn();
const mockFileReaderInstance = {
  readAsDataURL: mockReadAsDataURL,
  result: 'data:image/jpeg;base64,abc123',
};

const renderRegister = () => render(<Register />);

beforeEach(() => {
  jest.clearAllMocks();
  validateRegistration.mockReturnValue({ isValid: true, errors: {} });
  global.FileReader = jest.fn(() => mockFileReaderInstance);
  mockFileReaderInstance.onload = null;
});

describe('Register', () => {
  it('shows hint text under username field initially', () => {
    renderRegister();
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  });

  it('shows hint text under password field initially', () => {
    renderRegister();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows hint text under confirmPassword field initially', () => {
    renderRegister();
    expect(screen.getByText(/must match your password/i)).toBeInTheDocument();
  });

  it('shows hint text under displayName field initially', () => {
    renderRegister();
    expect(screen.getByText(/your public name/i)).toBeInTheDocument();
  });

  it('shows hint under avatar picker initially', () => {
    renderRegister();
    expect(screen.getByText(/jpg, png or gif/i)).toBeInTheDocument();
  });

  it('does not call register when validation fails', () => {
    validateRegistration.mockReturnValue({ isValid: false, errors: { username: 'Username is required' } });
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(register).not.toHaveBeenCalled();
  });

  it('shows validation errors on submit when form is invalid', () => {
    validateRegistration.mockReturnValue({ isValid: false, errors: { username: 'Username is required', password: 'Password is required' } });
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows confirmPassword error from validateRegistration', () => {
    validateRegistration.mockReturnValue({ isValid: false, errors: { confirmPassword: 'Passwords do not match' } });
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('clears confirmPassword error when user types in that field', () => {
    validateRegistration.mockReturnValue({ isValid: false, errors: { confirmPassword: 'Passwords do not match' } });
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'x' } });
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
  });

  it('clicking the avatar circle triggers the hidden file input', () => {
    renderRegister();
    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByTestId('avatar-circle'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('after file selected, FileReader.readAsDataURL is called and preview updates', async () => {
    renderRegister();
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    mockFileReaderInstance.onload({ target: { result: 'data:image/jpeg;base64,abc123' } });
    expect(mockReadAsDataURL).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /profile preview/i })).toBeInTheDocument();
    });
  });

  it('shows loading text on submit button during API call', async () => {
    register.mockImplementation(() => new Promise(() => {}));
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Creating account…')).toBeInTheDocument();
  });

  it('disables submit button during API call', async () => {
    register.mockImplementation(() => new Promise(() => {}));
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('navigates to /login on successful registration', async () => {
    register.mockResolvedValue({});
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('shows server error banner with is-visible class on registration failure', async () => {
    register.mockRejectedValue(new Error('Username already taken'));
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));
    await screen.findByText('Username already taken');
    expect(screen.getByRole('alert')).toHaveClass('is-visible');
  });
});
