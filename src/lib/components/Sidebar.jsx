import CompanionCard from './CompanionCard';
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
  ollamaLoading,
  onExport,
  hasMessages
}) {
  return (
    <aside className="sidebar p-4">
      <h2 className="mb-3">Companions</h2>

      <fieldset className="companion-radio-group" aria-label="Select AI companion">
        {Object.values(ASSISTANTS).map((c) => (
          <CompanionCard
            key={c.id}
            assistant={c}
            isActive={c.id === selectedAssistantId}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </fieldset>

      <div className="sidebar-section">
        <h3 className="mb-2">Provider</h3>
        <fieldset className="provider-radio" aria-label="Select AI provider">
          <label>
            <input
              type="radio"
              name="provider"
              value="chrome"
              checked={provider === 'chrome'}
              onChange={() => onProviderChange('chrome')}
              disabled={disabled}
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
              onChange={() => onProviderChange('ollama')}
              disabled={disabled}
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
          <div className="ollama-controls">
            <div className="model-select-row">
              <select
                value={selectedOllamaModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="model-select"
                disabled={disabled || ollamaModels.length === 0}
                aria-label="Select Ollama model"
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
                onClick={onRefreshModels}
                className="refresh-btn"
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

      <div className="sidebar-section">
        <button
          type="button"
          onClick={onExport}
          className="export-btn"
          disabled={disabled || !hasMessages}
          aria-label="Export chat as text file"
        >
          📥 Export Chat
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
