import { useEffect } from 'react';
import { ASSISTANTS } from './lib/utils/constants';
import { useStore } from './lib/state/useStore';

function App() {
  const {
    provider,
    selectedAssistantId,
    messages,
    textInputValue,
    isProcessing,
    showNoAiError,
    runtimeError,
    isSpeaking,
    kokoroReady,
    ollamaConnected,
    ollamaModels,
    selectedOllamaModel,
    modelDownloadProgress,
    init,
    selectCompanion,
    switchProvider,
    sendMessage,
    cancelRequest,
    exportChat,
    copyMessage,
    speakMessage,
    setTextInputValue,
    setSelectedOllamaModel,
    refreshOllamaModels,
    dismissError,
    initTTS
  } = useStore();

  useEffect(() => {
    init();
    initTTS();
  }, [init, initTTS]);

  const handleKeyDown = (e) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(textInputValue);
    }
  };

  if (showNoAiError) {
    return (
      <div className="error-page">
        <div className="error-content">
          <div className="error-icon">🧠</div>
          <h1>No AI Provider Available</h1>
          <p>This app needs either Chrome 131+ with Gemini Nano or a local Ollama instance.</p>
          <div className="error-links">
            <a
              href="https://developer.chrome.com/docs/ai/built-in"
              target="_blank"
              rel="noopener noreferrer"
              className="error-link"
            >
              📖 Chrome AI Setup
            </a>
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
              className="error-link"
            >
              🦙 Get Ollama
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Companions
        </h2>

        <fieldset className="companion-radio-group">
          {Object.values(ASSISTANTS).map((c) => (
            <label
              key={c.id}
              className={`companion-radio-card ${c.id === selectedAssistantId ? 'active' : ''}`}
              style={
                c.id === selectedAssistantId
                  ? {
                      '--accent': c.color,
                      '--accent-bg': c.colorBg,
                      '--accent-border': c.colorBorder
                    }
                  : {}
              }
            >
              <input
                type="radio"
                name="companion"
                value={c.id}
                checked={c.id === selectedAssistantId}
                onChange={() => selectCompanion(c.id)}
                disabled={isProcessing}
              />
              <span className="companion-emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <div className="companion-info">
                <span className="companion-name">{c.shortName}</span>
                <span className="companion-tagline">{c.tagline}</span>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Provider
          </h3>
          <fieldset className="provider-radio">
            <label>
              <input
                type="radio"
                name="provider"
                value="chrome"
                checked={provider === 'chrome'}
                onChange={() => switchProvider('chrome')}
                disabled={isProcessing}
              />
              <span aria-hidden="true">🧠</span>
              <span>Chrome AI</span>
            </label>
            <label>
              <input
                type="radio"
                name="provider"
                value="ollama"
                checked={provider === 'ollama'}
                onChange={() => switchProvider('ollama')}
                disabled={isProcessing}
              />
              <span aria-hidden="true">🦙</span>
              <span>Ollama</span>
              <span
                className={`status-dot ${ollamaConnected ? 'connected' : 'disconnected'}`}
                aria-hidden="true"
              />
            </label>
          </fieldset>

          {provider === 'ollama' && (
            <div className="mt-2 flex gap-2">
              <select
                value={selectedOllamaModel}
                onChange={(e) => setSelectedOllamaModel(e.target.value)}
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                disabled={isProcessing || ollamaModels.length === 0}
              >
                {ollamaModels.length === 0 && <option value="">No models found</option>}
                {ollamaModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={refreshOllamaModels}
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-100"
                disabled={isProcessing}
                aria-label="Refresh model list"
              >
                ↻
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={exportChat}
            className="w-full rounded-md border px-3 py-2 text-sm transition-colors hover:bg-gray-100"
            disabled={isProcessing || messages.length === 0}
          >
            📥 Export Chat
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-chat">
        {/* Header */}
        <header className="chat-header">
          <div className="flex items-center gap-2">
            <span
              className={`status-dot ${provider === 'ollama' && !ollamaConnected ? 'disconnected' : 'connected'}`}
            />
            <span className="text-sm text-gray-500">
              {provider === 'ollama'
                ? `Ollama · ${selectedOllamaModel || 'No model'}`
                : modelDownloadProgress !== null
                  ? `Chrome AI · Downloading ${modelDownloadProgress}%`
                  : 'Chrome AI · Gemini Nano'}
            </span>
          </div>
          {modelDownloadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300"
                style={{ width: `${modelDownloadProgress}%` }}
              />
            </div>
          )}
        </header>

        {/* Error Banner */}
        {runtimeError && (
          <div className="runtime-error-banner">
            <span>{runtimeError}</span>
            <button
              type="button"
              className="dismiss-error"
              onClick={dismissError}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Chat Area */}
        <div
          id="chat-container"
          className="chat-container"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 && (
            <div className="empty-chat-state">
              <span className="empty-chat-emoji" aria-hidden="true">
                {ASSISTANTS[selectedAssistantId]?.emoji || '💬'}
              </span>
              <p className="empty-chat-text">
                Start a conversation with{' '}
                <strong>{ASSISTANTS[selectedAssistantId]?.shortName || 'your companion'}</strong>
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-wrapper ${msg.src === 'req' ? 'user' : msg.src === 'error' ? 'error' : 'assistant'}`}
            >
              <div
                className={`message-bubble ${msg.src === 'req' ? 'user-bubble' : msg.src === 'error' ? 'error-bubble' : 'assistant-bubble'}`}
              >
                {msg.src !== 'req' && (
                  <div className="message-header">
                    <span className="message-avatar" aria-hidden="true">
                      {msg.src === 'error' ? '⚠️' : ASSISTANTS[selectedAssistantId]?.emoji || '🤖'}
                    </span>
                    <span className="message-sender">
                      {msg.src === 'error'
                        ? 'Error'
                        : ASSISTANTS[selectedAssistantId]?.name || 'Assistant'}
                    </span>
                  </div>
                )}

                {msg.text === 'processing...' ? (
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div
                    className="message-content"
                    dangerouslySetInnerHTML={{ __html: msg.formattedText }}
                  />
                )}

                <div className="message-footer">
                  <span className="message-time">{msg.timestamp}</span>
                  {msg.src !== 'req' && msg.text !== 'processing...' && (
                    <div className="message-actions">
                      <button
                        type="button"
                        className="action-btn"
                        aria-label="Copy message"
                        onClick={() => copyMessage(msg.text)}
                      >
                        📋
                      </button>
                      {kokoroReady && (
                        <button
                          type="button"
                          className="action-btn"
                          aria-label={isSpeaking ? 'Stop playing' : 'Play message'}
                          onClick={() => speakMessage(msg.text)}
                        >
                          {isSpeaking ? '🔇' : '🔊'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              id="chat-input"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... Enter to send, Shift+Enter for new line."
              className="chat-input"
              rows={1}
              aria-label="Chat message input"
              disabled={false}
            />
            <div className="chat-input-actions">
              <span className="char-count">{textInputValue.length}</span>
              {isProcessing ? (
                <button
                  type="button"
                  className="send-btn cancel"
                  onClick={cancelRequest}
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
                  onClick={() => sendMessage(textInputValue)}
                  disabled={!textInputValue.trim()}
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
      </main>
    </div>
  );
}

export default App;
