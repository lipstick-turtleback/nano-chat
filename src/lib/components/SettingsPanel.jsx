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
            <Cross2Icon className="settings-close-icon" />
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
                <div key={size.value} className="settings-radio-row">
                  <RadioGroup.Item className="settings-radio-item" value={String(size.value)}>
                    <RadioGroup.Indicator className="settings-radio-indicator" />
                  </RadioGroup.Item>
                  <label
                    className="settings-radio-label"
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
              <span className="provider-card-emoji">🧠</span>
              <div className="provider-card-info">
                <span className="provider-card-name">Chrome AI</span>
                <span className="provider-card-desc">
                  Gemini Nano — runs locally in Chrome 131+
                </span>
              </div>
            </button>

            <button
              type="button"
              className={`settings-provider-card ${provider === 'ollama' ? 'active' : ''}`}
              onClick={() => onProviderChange('ollama')}
            >
              <span className="provider-card-emoji">🦙</span>
              <div className="provider-card-info">
                <span className="provider-card-name">
                  Ollama
                  <span
                    className={`status-dot ${ollamaConnected ? 'connected' : 'disconnected'}`}
                  />
                </span>
                <span className="provider-card-desc">
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
                  <Select.Trigger className="settings-select-trigger">
                    <Select.Value placeholder="Select model" />
                    <Select.Icon>
                      <svg
                        className="settings-select-arrow"
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
                  <ReloadIcon className="settings-refresh-icon" />
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
              <DownloadIcon className="settings-action-icon" />
              Export Chat
            </button>
            <button
              type="button"
              className="settings-action-btn danger"
              onClick={handleClearChat}
              disabled={!hasMessages}
            >
              <TrashIcon className="settings-action-icon" />
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
