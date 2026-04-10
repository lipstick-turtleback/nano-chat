import MessageActions from './MessageActions';

function ChatMessage({
  message,
  assistant,
  onCopy,
  onSpeak,
  isSpeaking,
  isTTSLoading,
  lastCopiedId,
  kokoroReady
}) {
  if (!message?.text) return null;

  const isUser = message.src === 'req';
  const isError = message.src === 'error';
  const isProcessing = message.text === 'processing...';

  const bubbleClass = isUser
    ? 'user-bubble'
    : isError
      ? 'error-bubble'
      : 'assistant-bubble';

  const wrapperClass = isUser
    ? 'user'
    : isError || isProcessing
      ? 'error'
      : 'assistant';

  const avatar = isUser ? '👤' : isError ? '⚠️' : assistant?.emoji || '🤖';
  const senderName = isError ? 'Error' : assistant?.name || 'Assistant';

  return (
    <div className={`message-wrapper ${wrapperClass}`}>
      <div className={`message-bubble ${bubbleClass}`}>
        {!isUser && (
          <div className="message-header">
            <span className="message-avatar" aria-hidden="true">
              {avatar}
            </span>
            <span className="message-sender">{senderName}</span>
          </div>
        )}

        {isProcessing ? (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div
            className="message-content"
            dangerouslySetInnerHTML={{ __html: message.formattedText }}
          />
        )}

        <div className="message-footer">
          <span className="message-time">{message.timestamp}</span>
          {!isUser && !isProcessing && (
            <MessageActions
              messageId={message.id}
              onCopy={onCopy}
              onSpeak={onSpeak}
              isSpeaking={isSpeaking}
              isTTSLoading={isTTSLoading}
              lastCopiedId={lastCopiedId}
              kokoroReady={kokoroReady}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
