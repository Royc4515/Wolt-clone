import { render, screen } from '@testing-library/react';
import AuthCard from './AuthCard';

jest.mock('../shared/ThemeToggle', () => () => (
  <div role="group" aria-label="Theme" />
));

describe('AuthCard', () => {
  const renderCard = (props = {}) =>
    render(
      <AuthCard title="Log in" footer={<span>Footer text</span>} {...props}>
        <span data-testid="child">child content</span>
      </AuthCard>
    );

  it('renders the title as h1', () => {
    renderCard();
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument();
  });

  it('renders children', () => {
    renderCard();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders footer content', () => {
    renderCard();
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('renders the Wolt logo image', () => {
    renderCard();
    expect(screen.getByRole('img', { name: 'Wolt' })).toBeInTheDocument();
  });

  it('renders ThemeToggle', () => {
    renderCard();
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
  });

  it('applies default maxWidth of 440px to the card', () => {
    const { container } = renderCard();
    const card = container.querySelector('.auth-card');
    expect(card).toHaveStyle({ maxWidth: '440px' });
  });

  it('applies custom maxWidth when prop is provided', () => {
    const { container } = renderCard({ maxWidth: '460px' });
    const card = container.querySelector('.auth-card');
    expect(card).toHaveStyle({ maxWidth: '460px' });
  });
});
