import ChatMessage from './ChatMessage';

function ChatArea({ messages, assistant, onCopy, lastCopiedId, onToolSubmit, onRequestChallenge }) {
  return (
    <div
      id="chat-container"
      className="chat-container"
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
            Start a conversation with <strong>{assistant?.shortName || 'your companion'}</strong>
          </p>
          {onRequestChallenge && (
            <button type="button" className="challenge-btn-empty" onClick={onRequestChallenge}>
              🎲 Generate a Challenge
            </button>
          )}
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          assistant={msg.src === 'resp' || msg.src === 'info' ? assistant : null}
          onCopy={(id) => onCopy(msg.text, id)}
          lastCopiedId={lastCopiedId}
          onToolSubmit={onToolSubmit}
        />
      ))}

      {messages.length > 0 && onRequestChallenge && (
        <div className="challenge-bar">
          <button type="button" className="challenge-btn" onClick={onRequestChallenge}>
            🎲 Generate a Creative Challenge
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatArea;
