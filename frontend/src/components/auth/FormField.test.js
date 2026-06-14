import { render, screen } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  it('renders the label text', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="hint text" error={null}>
        <input id="username" type="text" />
      </FormField>
    );
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders children (input element)', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="hint text" error={null}>
        <input id="username" type="text" data-testid="input" />
      </FormField>
    );
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('label has correct htmlFor attribute', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="hint text" error={null}>
        <input id="username" type="text" />
      </FormField>
    );
    expect(screen.getByText('Username').closest('label')).toHaveAttribute('for', 'username');
  });

  it('shows hint text when error is null', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="3–20 characters" error={null}>
        <input id="username" type="text" />
      </FormField>
    );
    expect(screen.getByText('3–20 characters')).toBeInTheDocument();
  });

  it('shows error text when error is truthy', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="3–20 characters" error="Username is required">
        <input id="username" type="text" />
      </FormField>
    );
    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('does not show hint when error is truthy', () => {
    render(
      <FormField label="Username" htmlFor="username" hint="3–20 characters" error="Username is required">
        <input id="username" type="text" />
      </FormField>
    );
    expect(screen.queryByText('3–20 characters')).not.toBeInTheDocument();
  });
});
