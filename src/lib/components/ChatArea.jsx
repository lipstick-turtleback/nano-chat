import ChatMessage from './ChatMessage';

function ChatArea({
  messages,
  assistant,
  onCopy,
  onSpeak,
  isSpeaking,
  isTTSLoading,
  lastCopiedId,
  kokoroReady
}) {
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
            Start a conversation with{' '}
            <strong>{assistant?.shortName || 'your companion'}</strong>
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          assistant={msg.src === 'resp' || msg.src === 'info' ? assistant : null}
          onCopy={(id) => onCopy(msg.text, id)}
          onSpeak={() => onSpeak(msg.text)}
          isSpeaking={isSpeaking}
          isTTSLoading={isTTSLoading}
          lastCopiedId={lastCopiedId}
          kokoroReady={kokoroReady}
        />
      ))}
    </div>
  );
}

export default ChatArea;
