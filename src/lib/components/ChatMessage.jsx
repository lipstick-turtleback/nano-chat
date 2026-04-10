import React from 'react';
import MessageActions from './MessageActions';

function ChatMessage({ message, onCopy, onPlay, isSpeaking, assistant }) {
  if (!message?.text) return null;

  const isUser = message.src === 'req';
  const isError = message.src === 'error';
  const isInfo = message.src === 'info';

  const avatar = isUser ? '👤' : isError ? '⚠️' : isInfo ? 'ℹ️' : assistant?.emoji || '🤖';

  return (
    <div
      className={`message-wrapper ${isUser ? 'user' : isError ? 'error' : isInfo ? 'info' : 'assistant'}`}
    >
      <div
        className={`message-bubble ${isUser ? 'user-bubble' : isError ? 'error-bubble' : 'assistant-bubble'}`}
      >
        {!isUser && (
          <div className="message-header">
            <span className="message-avatar">{avatar}</span>
            <span className="message-sender">{assistant?.name || 'Assistant'}</span>
          </div>
        )}
        <div
          className="message-content"
          dangerouslySetInnerHTML={{ __html: message.formattedText }}
        />
        <div className="message-footer">
          <span className="message-time">{message.timestamp}</span>
          {!isUser && (
            <MessageActions
              message={message}
              onCopy={onCopy}
              onPlay={onPlay}
              isSpeaking={isSpeaking}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChatMessage);
