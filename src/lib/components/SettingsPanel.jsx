import { useState } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import { Cross2Icon, ReloadIcon, DownloadIcon, TrashIcon } from '@radix-ui/react-icons';

const FONT_SIZES = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 18 },
  { label: 'Extra Large', value: 20 }
];

function SettingsPanel({
  settings,
  onUpdate,
  onClose,
  provider,
  onProviderChange,
  ollamaConnected,
  ollamaModels,
  selectedOllamaModel,
  onModelChange,
  onRefreshModels,
  onExportChat,
  hasMessages,
  onClearChat
}) {
  const [fontSize, setFontSize] = useState(String(settings.fontSize || 16));

  const handleSave = () => {
    onUpdate({
      fontSize: Number(fontSize)
    });
    document.documentElement.style.fontSize = `${fontSize}px`;
    onClose?.();
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages? This cannot be undone.')) {
      onClearChat?.();
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h3>⚙️ Settings</h3>
          <button
            type="button"
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <Cross2Icon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body">
          {/* Appearance */}
          <h4 className="settings-section-title">Appearance</h4>

          <fieldset className="settings-group">
            <legend>Font Size</legend>
            <RadioGroup.Root
              className="settings-radio-group"
              value={fontSize}
              onValueChange={setFontSize}
            >
              {FONT_SIZES.map((size) => (
                <div key={size.value} className="flex items-center">
                  <RadioGroup.Item className="settings-radio-item" value={String(size.value)}>
                    <RadioGroup.Indicator className="settings-radio-indicator" />
                  </RadioGroup.Item>
                  <label
                    className="ml-3 cursor-pointer select-none"
                    style={{ fontSize: `${size.value}px` }}
                  >
                    {size.label}
                  </label>
                </div>
              ))}
            </RadioGroup.Root>
          </fieldset>

          {/* AI Provider */}
          <h4 className="settings-section-title">AI Provider</h4>

          <div className="settings-provider-cards">
            <button
              type="button"
              className={`settings-provider-card ${provider === 'chrome' ? 'active' : ''}`}
              onClick={() => onProviderChange('chrome')}
            >
              <span className="text-2xl">🧠</span>
              <div className="text-left">
                <span className="block text-sm font-semibold text-gray-800">Chrome AI</span>
                <span className="text-xs text-gray-400">
                  Gemini Nano — runs locally in Chrome 131+
                </span>
              </div>
            </button>

            <button
              type="button"
              className={`settings-provider-card ${provider === 'ollama' ? 'active' : ''}`}
              onClick={() => onProviderChange('ollama')}
            >
              <span className="text-2xl">🦙</span>
              <div className="flex-1 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  Ollama
                  <span
                    className={`h-2 w-2 rounded-full ${ollamaConnected ? 'bg-emerald-500' : 'bg-red-400'}`}
                  />
                </span>
                <span className="text-xs text-gray-400">
                  Local models — requires Ollama running
                </span>
              </div>
            </button>
          </div>

          {provider === 'ollama' && (
            <fieldset className="settings-group">
              <legend>Ollama Model</legend>
              <div className="settings-model-row">
                <Select.Root
                  value={selectedOllamaModel}
                  onValueChange={onModelChange}
                  disabled={ollamaModels.length === 0}
                >
                  <Select.Trigger className="settings-select-trigger disabled:opacity-40">
                    <Select.Value placeholder="Select model" />
                    <Select.Icon>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="settings-select-content">
                      <Select.Viewport>
                        {ollamaModels.map((m) => (
                          <Select.Item key={m.name} value={m.name} className="settings-select-item">
                            <Select.ItemText>{m.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                <button
                  type="button"
                  className="settings-refresh-btn"
                  onClick={onRefreshModels}
                  aria-label="Refresh model list"
                >
                  <ReloadIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              {!ollamaConnected && (
                <p className="settings-hint">
                  Start Ollama locally: <code>ollama serve</code>
                </p>
              )}
            </fieldset>
          )}

          {/* Data */}
          <h4 className="settings-section-title">Data</h4>

          <div className="settings-actions">
            <button
              type="button"
              className="settings-action-btn"
              onClick={onExportChat}
              disabled={!hasMessages}
            >
              <DownloadIcon className="h-4 w-4" />
              Export Chat
            </button>
            <button
              type="button"
              className="settings-action-btn danger"
              onClick={handleClearChat}
              disabled={!hasMessages}
            >
              <TrashIcon className="h-4 w-4" />
              Clear Chat
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button type="button" className="settings-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="settings-btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
