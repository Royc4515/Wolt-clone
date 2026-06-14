import { render, screen, fireEvent } from '@testing-library/react';
import PasswordInput from './PasswordInput';

const renderInput = (props = {}) =>
  render(
    <PasswordInput
      id="password"
      value=""
      onChange={() => {}}
      placeholder="••••••••"
      {...props}
    />
  );

describe('PasswordInput', () => {
  it('renders as type="password" by default', () => {
    renderInput();
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
  });

  it('renders a toggle button', () => {
    renderInput();
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });

  it('clicking toggle changes input to type="text"', () => {
    renderInput();
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text');
  });

  it('clicking toggle again changes input back to type="password"', () => {
    renderInput();
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
  });

  it('toggle button label changes to "Hide password" when visible', () => {
    renderInput();
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('passes className to the input', () => {
    renderInput({ className: 'input is-invalid' });
    expect(screen.getByPlaceholderText('••••••••')).toHaveClass('input', 'is-invalid');
  });

  it('calls onChange when user types', () => {
    const onChange = jest.fn();
    renderInput({ onChange });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });
});
