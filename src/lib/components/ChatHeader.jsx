function ChatHeader({
  provider,
  ollamaConnected,
  selectedOllamaModel,
  downloadProgress,
  onCancel
}) {
  const providerLabel =
    provider === 'ollama'
      ? `Ollama · ${selectedOllamaModel || 'No model'}`
      : downloadProgress !== null
        ? `Chrome AI · Downloading ${downloadProgress}%`
        : 'Chrome AI · Gemini Nano';

  return (
    <header className="chat-header">
      <div className="header-left">
        <div className="header-status-indicator">
          <span
            className={`status-badge ${provider === 'ollama' && !ollamaConnected ? 'disconnected' : 'connected'}`}
          />
          <span className="header-status-text">{providerLabel}</span>
        </div>
      </div>
      {downloadProgress !== null && (
        <div className="download-progress-bar">
          <div className="download-progress-fill" style={{ width: `${downloadProgress}%` }} />
        </div>
      )}
      {onCancel && (
        <button type="button" className="cancel-btn" onClick={onCancel} aria-label="Cancel request">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </header>
  );
}

export default ChatHeader;
