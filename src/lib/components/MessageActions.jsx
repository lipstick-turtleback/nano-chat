function MessageActions({
  messageId,
  onCopy,
  onSpeak,
  isSpeaking,
  isTTSLoading,
  lastCopiedId,
  kokoroReady
}) {
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
      {kokoroReady && (
        <button
          type="button"
          className="action-btn"
          aria-label={
            isSpeaking ? 'Stop playing' : isTTSLoading ? 'Loading speech...' : 'Play message'
          }
          onClick={onSpeak}
          disabled={isTTSLoading}
          title={isTTSLoading ? 'Loading speech model...' : 'Play via TTS'}
        >
          {isTTSLoading ? '⏳' : isSpeaking ? '🔇' : '🔊'}
        </button>
      )}
    </div>
  );
}

export default MessageActions;
