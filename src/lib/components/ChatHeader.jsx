function ChatHeader({ provider, ollamaConnected, selectedOllamaModel, downloadProgress }) {
  const providerLabel =
    provider === 'ollama'
      ? `Ollama · ${selectedOllamaModel || 'No model'}`
      : downloadProgress !== null
        ? `Chrome AI · Downloading ${downloadProgress}%`
        : 'Chrome AI · Gemini Nano';

  return (
    <header className="chat-header">
      <div className="header-status">
        <span
          className={`status-dot ${provider === 'ollama' && !ollamaConnected ? 'disconnected' : 'connected'}`}
        />
        <span className="header-label">{providerLabel}</span>
      </div>
      {downloadProgress !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
    </header>
  );
}

export default ChatHeader;
