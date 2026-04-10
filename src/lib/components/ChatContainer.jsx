import ChatMessage from './ChatMessage';

function ChatContainer({ messages, containerRef, onCopy, onPlay, isSpeaking, assistant }) {
  return (
    <div
      className="chat-container"
      ref={containerRef}
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Chat messages"
    >
      {messages.length === 0 && (
        <div className="empty-chat-state">
          <span className="empty-chat-emoji" aria-hidden="true">
            {assistant?.emoji || '💬'}
          </span>
          <p className="empty-chat-text">
            Start a conversation with{' '}
            <strong>{assistant?.shortName || 'your companion'}</strong>
          </p>
        </div>
      )}
      {messages.map((msg, index) => (
        <ChatMessage
          key={`${msg.timestamp}-${msg.src}-${index}`}
          message={msg}
          onCopy={onCopy}
          onPlay={onPlay}
          isSpeaking={isSpeaking}
          assistant={msg.src === 'resp' || msg.src === 'info' ? assistant : null}
        />
      ))}
    </div>
  );
}

export default ChatContainer;
