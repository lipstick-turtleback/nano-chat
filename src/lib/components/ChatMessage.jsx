import { useMemo } from 'react';
import MessageActions from './MessageActions';
import ToolRenderer from './ToolRenderer';

/**
 * Try to parse tool JSON from message text.
 * The LLM may return JSON wrapped in markdown code blocks or plain.
 */
function extractTool(text) {
  if (!text) return null;

  // Try to find a JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Try cleaning markdown code block markers
    const cleaned = jsonMatch[0]
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

/**
 * Get the display text (everything except the tool JSON)
 */
function getDisplayText(text, tool) {
  if (!tool) return text;
  return text.replace(/\{[\s\S]*"tool"\s*:[\s\S]*\}/, '').trim();
}

function ChatMessage({
  message,
  assistant,
  onCopy,
  onSpeak,
  isSpeaking,
  isTTSLoading,
  lastCopiedId,
  kokoroReady,
  onToolSubmit
}) {
  // Detect tool JSON in the message (must be before any early return)
  const tool = useMemo(() => extractTool(message?.text), [message?.text]);
  const displayText = tool ? getDisplayText(message?.text, tool) : message?.text;

  if (!message?.text) return null;

  const isUser = message.src === 'req';
  const isError = message.src === 'error';
  const isProcessing = message.text === 'processing...';

  const bubbleClass = isUser ? 'user-bubble' : isError ? 'error-bubble' : 'assistant-bubble';
  const wrapperClass = isUser ? 'user' : isError || isProcessing ? 'error' : 'assistant';

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
          <>
            {displayText &&
              displayText !== 'processing...' &&
              (message.isStreaming ? (
                <div className="message-content streaming-text">{displayText}</div>
              ) : (
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: message.formattedText }}
                />
              ))}
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
