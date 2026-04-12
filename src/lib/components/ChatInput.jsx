import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea';
import { useEffect, useRef } from 'react';

function ChatInput({ value, onChange, onKeyDown, onSend, onCancel, isProcessing, activeTool, toolHint }) {
  const textareaRef = useAutoResizeTextarea(value, 1, 8);
  const hasText = value.trim().length > 0;
  const isOverLimit = value.length > 4000;
  const prevToolRef = useRef(null);

  // Auto-focus when a text-input tool appears
  useEffect(() => {
    const textTools = ['riddle', 'fill_blank', 'reflection', 'word_ladder', 'emoji_pictionary', 'emoji_pict', 'anagram', 'reorder'];
    if (activeTool && textTools.includes(activeTool.tool) && activeTool.tool !== prevToolRef.current) {
      // Brief delay so the tool card renders, then focus the main input as fallback hint
      const t = setTimeout(() => {
        textareaRef.current?.focus();
      }, 200);
      return () => clearTimeout(t);
    }
    prevToolRef.current = activeTool?.tool || null;
  }, [activeTool, textareaRef]);

  return (
    <div className="chat-input-area">
      {/* Active tool hint banner */}
      {activeTool && !isProcessing && (
        <div className="tool-hint-banner">
          <span className="tool-hint-icon">👆</span>
          <span className="tool-hint-text">{toolHint || 'Interact with the challenge above'}</span>
        </div>
      )}
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            isProcessing
              ? 'Waiting for response...'
              : toolHint || 'Type your message... Enter to send, Shift+Enter for new line.'
          }
          className="chat-input"
          rows={1}
          aria-label="Chat message input"
          disabled={false}
        />
        <div className="chat-input-actions">
          <span className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
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
              disabled={!hasText}
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
