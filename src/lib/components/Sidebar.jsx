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
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Companions
      </h2>

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

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Provider
        </h3>
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
          <div className="mt-2 flex gap-2">
            <select
              value={selectedOllamaModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="flex-1 text-sm border rounded-md px-2 py-1"
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
              className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100 transition-colors"
              disabled={ollamaLoading}
              aria-label="Refresh model list"
            >
              ↻
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onExport}
          className="w-full text-sm px-3 py-2 border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
