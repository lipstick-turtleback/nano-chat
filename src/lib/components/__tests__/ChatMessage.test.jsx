import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  const mockMessage = {
    src: 'resp',
    text: 'Hello **world**',
    formattedText: '<p>Hello <strong>world</strong></p>',
    timestamp: '10:30 AM'
  };

  const mockOnCopy = jest.fn();
  const mockOnPlay = jest.fn();

  it('renders assistant message correctly', () => {
    render(
      <ChatMessage
        message={mockMessage}
        onCopy={mockOnCopy}
        onPlay={mockOnPlay}
        isSpeaking={false}
        assistant={{ name: 'TestBot', emoji: '🤖' }}
      />
    );

    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('TestBot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play message/i })).toBeInTheDocument();
  });

  it('renders user message without action buttons', () => {
    const userMessage = { ...mockMessage, src: 'req' };

    render(
      <ChatMessage
        message={userMessage}
        onCopy={mockOnCopy}
        onPlay={mockOnPlay}
        isSpeaking={false}
        assistant={null}
      />
    );

    expect(screen.queryByRole('button', { name: /copy message/i })).not.toBeInTheDocument();
  });

  it('does not render when message text is empty', () => {
    const { container } = render(
      <ChatMessage
        message={{ text: '' }}
        onCopy={mockOnCopy}
        onPlay={mockOnPlay}
        isSpeaking={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows mute icon when already speaking', () => {
    render(
      <ChatMessage
        message={mockMessage}
        onCopy={mockOnCopy}
        onPlay={mockOnPlay}
        isSpeaking={true}
        assistant={{ name: 'TestBot', emoji: '🤖' }}
      />
    );

    expect(screen.getByRole('button', { name: /stop playing/i })).toBeInTheDocument();
  });
});
