// src/__tests__/components/ErrorBoundary.test.jsx
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// A component that unconditionally throws
function BombComponent() {
  throw new Error('Test explosion!');
}

// A component that renders normally
function SafeComponent() {
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  test('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BombComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test explosion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  test('renders multiple children without error', () => {
    render(
      <ErrorBoundary>
        <span>Child 1</span>
        <span>Child 2</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
