import { ASSISTANTS } from '../utils/constants';

function Sidebar({
  selectedAssistantId,
  onSelect,
  disabled,
  provider,
  onProviderChange,
  ollamaConnected,
  ollamaModels,
  selectedOllamaModel,
  onModelChange,
  onRefreshModels,
  ollamaLoading
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Companions</h2>
      </div>

      <div className="companion-list">
        {Object.entries(ASSISTANTS).map(([id, assistant]) => {
          const isActive = id === selectedAssistantId;
          return (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              disabled={disabled}
              className={`companion-btn ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? {
                      '--btn-accent': assistant.color,
                      '--btn-bg': assistant.colorLight,
                      '--btn-border': assistant.colorBorder
                    }
                  : null
              }
            >
              <span className="companion-emoji" aria-hidden="true">
                {assistant.emoji}
              </span>
              <div className="companion-info">
                <span className="companion-name">{assistant.shortName}</span>
                <span className="companion-tagline">{assistant.tagline}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="sidebar-divider" />

      <div className="provider-section">
        <h3 className="sidebar-section-title">AI Provider</h3>

        <div className="provider-buttons">
          <button
            type="button"
            className={`provider-btn ${provider === 'chrome' ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => onProviderChange('chrome')}
            aria-label="Use Chrome AI provider"
          >
            <span className="provider-icon" aria-hidden="true">🧠</span>
            Chrome AI
          </button>
          <button
            type="button"
            className={`provider-btn ${provider === 'ollama' ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => onProviderChange('ollama')}
            aria-label="Use Ollama provider"
          >
            <span className="provider-icon" aria-hidden="true">🦙</span>
            Ollama
            <span
              className={`status-dot ${ollamaConnected ? 'connected' : 'disconnected'}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {provider === 'ollama' && (
          <div className="ollama-controls">
            <div className="model-select-row">
              <select
                value={selectedOllamaModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={disabled || ollamaModels.length === 0}
                className="model-select"
                aria-label="Select Ollama model"
              >
                {ollamaModels.length === 0 && (
                  <option value="">No models found</option>
                )}
                {ollamaModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="refresh-btn"
                onClick={onRefreshModels}
                disabled={ollamaLoading}
                aria-label="Refresh model list"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                </svg>
              </button>
            </div>
            {!ollamaConnected && (
              <p className="ollama-hint">
                Start Ollama locally: <code>ollama serve</code>
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
