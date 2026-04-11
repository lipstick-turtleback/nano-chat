import { useState } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Switch from '@radix-ui/react-switch';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { Cross2Icon, GearIcon, ReloadIcon, DownloadIcon, TrashIcon } from '@radix-ui/react-icons';

const FONT_SIZES = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 18 },
  { label: 'Extra Large', value: 20 }
];

const SPEECH_ENGINES = [
  { label: 'Browser Speech', value: 'browser', desc: 'Built-in, fast, no download' },
  { label: 'Kokoro AI Voice', value: 'kokoro', desc: 'High quality, ~2.5MB download' },
  { label: 'Off', value: 'off', desc: 'No speech synthesis' }
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
  const [speechEngine, setSpeechEngine] = useState(settings.speechEngine || 'browser');
  const [voiceStyle, setVoiceStyle] = useState(settings.voiceStyle || 'default');
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak || false);

  const handleSave = () => {
    onUpdate({
      fontSize: Number(fontSize),
      speechEngine,
      voiceStyle,
      autoSpeak
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
    <Dialog.Root open onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-fade-in fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <GearIcon className="h-5 w-5" />
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                aria-label="Close"
              >
                <Cross2Icon className="h-5 w-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6 px-6 py-5">
            {/* Appearance */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Appearance
              </h3>
              <RadioGroup.Root
                className="flex flex-col gap-1"
                value={fontSize}
                onValueChange={setFontSize}
              >
                {FONT_SIZES.map((size) => (
                  <div key={size.value} className="flex items-center">
                    <RadioGroup.Item
                      value={String(size.value)}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 transition-all data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-500"
                    >
                      <RadioGroup.Indicator className="h-2 w-2 rounded-full bg-white" />
                    </RadioGroup.Item>
                    <label
                      className="ml-3 cursor-pointer select-none text-sm text-gray-700"
                      style={{ fontSize: `${size.value}px` }}
                    >
                      {size.label}
                    </label>
                  </div>
                ))}
              </RadioGroup.Root>
            </section>

            {/* Speech */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Speech
              </h3>

              <RadioGroup.Root
                className="flex flex-col gap-1"
                value={speechEngine}
                onValueChange={setSpeechEngine}
              >
                {SPEECH_ENGINES.map((engine) => (
                  <div key={engine.value} className="flex items-center py-1.5">
                    <RadioGroup.Item
                      value={engine.value}
                      className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 transition-all data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-500"
                    >
                      <RadioGroup.Indicator className="h-2 w-2 rounded-full bg-white" />
                    </RadioGroup.Item>
                    <label className="ml-3 cursor-pointer select-none">
                      <span className="block text-sm font-medium text-gray-800">
                        {engine.label}
                      </span>
                      <span className="text-xs text-gray-400">{engine.desc}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup.Root>

              <div className="mt-3">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Voice Style
                </label>
                <Select.Root value={voiceStyle} onValueChange={setVoiceStyle}>
                  <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition-colors hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <Select.Value />
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
                    <Select.Content className="z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Select.Viewport>
                        {[
                          { value: 'default', label: 'Default (clear)' },
                          { value: 'soft', label: 'Soft (calm)' },
                          { value: 'energetic', label: 'Energetic (upbeat)' },
                          { value: 'measured', label: 'Measured (paced)' },
                          { value: 'cheerful', label: 'Cheerful (bright)' },
                          { value: 'upbeat', label: 'Upbeat (creative)' }
                        ].map((opt) => (
                          <Select.Item
                            key={opt.value}
                            value={opt.value}
                            className="cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-600"
                          >
                            <Select.ItemText>{opt.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="mt-3 flex items-center justify-between py-1">
                <label className="select-none text-sm text-gray-700">
                  Auto-speak assistant responses
                </label>
                <Switch.Root
                  className="relative h-6 w-10 cursor-pointer rounded-full bg-gray-200 transition-colors duration-200 data-[state=checked]:bg-indigo-500"
                  checked={autoSpeak}
                  onCheckedChange={setAutoSpeak}
                >
                  <Switch.Thumb className="block h-4 w-4 translate-x-1 translate-y-1 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
            </section>

            {/* AI Provider */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                AI Provider
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    provider === 'chrome'
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    provider === 'ollama'
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Ollama Model
                  </label>
                  <div className="flex gap-2">
                    <Select.Root
                      value={selectedOllamaModel}
                      onValueChange={onModelChange}
                      disabled={ollamaModels.length === 0}
                    >
                      <Select.Trigger className="flex flex-1 items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition-colors hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40">
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
                        <Select.Content className="z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <Select.Viewport>
                            {ollamaModels.map((m) => (
                              <Select.Item
                                key={m.name}
                                value={m.name}
                                className="cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-600"
                              >
                                <Select.ItemText>{m.name}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <button
                      type="button"
                      onClick={onRefreshModels}
                      className="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
                      aria-label="Refresh model list"
                    >
                      <ReloadIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  {!ollamaConnected && (
                    <p className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400">
                      Start Ollama locally:{' '}
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">ollama serve</code>
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Data */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Data
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onExportChat}
                  disabled={!hasMessages}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export Chat
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={!hasMessages}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-red-300 hover:bg-red-50/50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear Chat
                </button>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <Dialog.Close asChild>
              <button className="rounded-lg px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SettingsPanel;
