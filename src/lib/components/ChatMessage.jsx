import { useMemo } from 'react';
import MessageActions from './MessageActions';
import ToolRenderer from './ToolRenderer';
import { renderMarkdown } from '../utils/markdown';

/**
 * Try to parse tool JSON from message text.
 * Looks for { "tool": "...", "title": "...", "content": {...} } pattern.
 */
function extractTool(text) {
  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * Get the display text with tool JSON removed.
 */
function getDisplayText(text, tool) {
  if (!tool) return text;

  // Try to remove the JSON block from the text
  try {
    // Find where the tool JSON starts
    const jsonIndex = text.indexOf('{"tool"');
    if (jsonIndex > 0) {
      return text.substring(0, jsonIndex).trim();
    }
    // If text IS the tool JSON, return empty (tool renderer handles display)
    if (text.startsWith('{"tool"')) {
      return '';
    }
  } catch {
    // Fallback: return original text
  }

  return text;
}

function ChatMessage({ message, assistant, onCopy, lastCopiedId, onToolSubmit }) {
  // Detect tool JSON in the message (must be before any early return)
  const tool = useMemo(() => extractTool(message?.text), [message?.text]);
  const displayText = getDisplayText(message?.text, tool);

  if (!message?.text) return null;

  const isUser = message.src === 'req';
  const isError = message.src === 'error';
  const isInfo = message.src === 'info';
  const isProcessing = message.text === 'processing...';

  let bubbleClass, wrapperClass, avatar, senderName;

  if (isUser) {
    bubbleClass = 'user-bubble';
    wrapperClass = 'user';
    avatar = '👤';
  } else if (isError) {
    bubbleClass = 'error-bubble';
    wrapperClass = 'error';
    avatar = '⚠️';
    senderName = 'Error';
  } else if (isInfo) {
    bubbleClass = 'info-bubble';
    wrapperClass = 'info';
    avatar = '📌';
    senderName = '';
  } else {
    bubbleClass = 'assistant-bubble';
    wrapperClass = 'assistant';
    avatar = assistant?.emoji || '🤖';
    senderName = assistant?.name || 'Assistant';
  }

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
          <>
            {displayText && displayText !== 'processing...' && (
              <div
                className="message-content"
                dangerouslySetInnerHTML={{ __html: tool ? renderMarkdown(displayText) : message.formattedText }}
              />
            )}
            {tool && (
              <ToolRenderer
                tool={tool}
                onSubmit={(result) => onToolSubmit?.(message.id, tool, result)}
              />
            )}
          </>
        )}

        <div className="message-footer">
          <span className="message-time">{message.timestamp}</span>
          {!isUser && !isProcessing && (
            <MessageActions messageId={message.id} onCopy={onCopy} lastCopiedId={lastCopiedId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
