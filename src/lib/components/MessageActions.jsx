function MessageActions({ messageId, onCopy, lastCopiedId }) {
  const isJustCopied = lastCopiedId === messageId;

  return (
    <div className="message-actions">
      <button
        type="button"
        className="action-btn"
        aria-label={isJustCopied ? 'Copied!' : 'Copy message'}
        onClick={() => onCopy(messageId)}
        title={isJustCopied ? 'Copied!' : 'Copy to clipboard'}
      >
        {isJustCopied ? '✅' : '📋'}
      </button>
    </div>
  );
}

export default MessageActions;
