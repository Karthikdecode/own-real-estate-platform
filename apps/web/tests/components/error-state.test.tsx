import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from '@/components/feedback/error-state';

describe('ErrorState', () => {
  it('announces the title and message as an alert', () => {
    render(<ErrorState title="Listings unavailable" message="The API could not be reached." />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Listings unavailable');
    expect(alert).toHaveTextContent('The API could not be reached.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls the retry handler when the user asks to try again', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Something failed." onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
