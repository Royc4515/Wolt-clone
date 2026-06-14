import { render, screen } from '@testing-library/react';
import FormError from './FormError';

describe('FormError', () => {
  it('does not have is-visible class when message is empty', () => {
    const { container } = render(<FormError message="" />);
    expect(container.firstChild).not.toHaveClass('is-visible');
  });

  it('has is-visible class when message is truthy', () => {
    const { container } = render(<FormError message="Something went wrong" />);
    expect(container.firstChild).toHaveClass('is-visible');
  });

  it('displays the message text', () => {
    render(<FormError message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    const { container } = render(<FormError message="" />);
    expect(container.firstChild).toHaveAttribute('role', 'alert');
  });

  it('has aria-live="polite"', () => {
    const { container } = render(<FormError message="" />);
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
  });
});
