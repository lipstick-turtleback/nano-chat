import { useMemo } from 'react';
import ChatMessage from './ChatMessage';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Check if the last assistant message has an unsubmitted tool.
 */
function getLastActiveTool(messages) {
  if (!messages || messages.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.src !== 'resp' || !msg.text) continue;

    try {
      const jsonMatch = msg.text.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/);
      if (jsonMatch) {
        const tool = JSON.parse(jsonMatch[0]);
        // Tool is "active" if it hasn't been submitted yet
        if (!msg.toolResult) {
          return tool;
        }
      }
    } catch {
      // Not a tool message
    }
  }
  return null;
}

function ChatArea({ messages, assistant, onCopy, lastCopiedId, onToolSubmit, inspiration = 0, isProcessing = false }) {
  const activeTool = useMemo(() => getLastActiveTool(messages), [messages]);

  // Check if we're waiting for the first AI response (shows skeleton)
  const showSkeleton = isProcessing && messages.length > 0 &&
    messages[messages.length - 1]?.src === 'req';

  return (
    <div
      id="chat-container"
      className="chat-container"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Chat messages"
      data-active-tool={activeTool?.tool || ''}
    >
      {messages.length === 0 && (
        <div className="empty-chat-state">
          <span className="empty-chat-emoji" aria-hidden="true">
            {assistant?.emoji || '💬'}
          </span>
          <p className="empty-chat-text">
            Start a conversation with <strong>{assistant?.shortName || 'your companion'}</strong>
          </p>
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
          inspiration={inspiration}
        />
      ))}

      {showSkeleton && <LoadingSkeleton />}
    </div>
  );
}

export default ChatArea;
