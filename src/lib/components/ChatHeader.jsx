function ChatHeader({ provider, ollamaConnected, selectedOllamaModel, downloadProgress }) {
  const providerLabel =
    provider === 'ollama'
      ? `Ollama · ${selectedOllamaModel || 'No model'}`
      : downloadProgress !== null
        ? `Chrome AI · Downloading ${downloadProgress}%`
        : 'Chrome AI · Gemini Nano';

  return (
    <header className="chat-header relative">
      <div className="flex items-center gap-2">
        <span
          className={`status-dot ${provider === 'ollama' && !ollamaConnected ? 'disconnected' : 'connected'}`}
        />
        <span className="text-sm text-gray-500">{providerLabel}</span>
      </div>
      {downloadProgress !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
    </header>
  );
}

export default ChatHeader;
