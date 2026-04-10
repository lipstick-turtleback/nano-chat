import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders error message with instructions', () => {
    render(<ErrorBoundary />);

    expect(screen.getByText('Chrome AI Not Available')).toBeInTheDocument();
    expect(
      screen.getByText(/This app requires Chrome 131\+ with Gemini Nano enabled/)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Ollama/).length).toBeGreaterThan(0);
  });

  it('has links to setup guide and Ollama', () => {
    render(<ErrorBoundary />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://developer.chrome.com/docs/ai/built-in');
    expect(links[1]).toHaveAttribute('href', 'https://ollama.com');
  });
});
