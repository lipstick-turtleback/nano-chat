function ChatInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  onCancel,
  inputRef,
  isProcessing,
  maxInputLength
}) {
  const hasText = value.trim().length > 0;
  const isOverLimit = value.length > maxInputLength;

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper">
        <textarea
          id="chat-input"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            isProcessing
              ? 'Waiting for response...'
              : 'Type your message... Enter to send, Shift+Enter for new line.'
          }
          className="chat-input"
          rows={1}
          aria-label="Chat message input"
          disabled={isProcessing}
        />
        <div className="chat-input-actions">
          <span
            className={`char-count ${isOverLimit ? 'text-red-500' : ''}`}
            aria-label={`${value.length} characters`}
          >
            {value.length}
          </span>
          {isProcessing ? (
            <button
              type="button"
              className="send-btn cancel"
              onClick={onCancel}
              aria-label="Cancel request"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="send-btn"
              onClick={onSend}
              disabled={!hasText || isOverLimit}
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
