import { create } from 'zustand';
import { ChromePromptClient } from '../ai/ChromePromptClient';
import { OllamaClient } from '../ai/OllamaClient';
import {
  ASSISTANTS,
  FOCUS_TIMEOUT,
  GREETING_PROMPT,
  MAX_INPUT_LENGTH,
  DEFAULT_OLLAMA_MODEL
} from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';
import { speak, stopSpeaking, initTTS, isTTSReady } from '../services/ttsService';

let messageId = 0;
const nextId = () => `msg-${++messageId}-${Date.now()}`;

function createMessageObj(text, srcType = 'resp') {
  return {
    id: nextId(),
    src: srcType,
    text,
    formattedText: renderMarkdown(text),
    timestamp: new Date().toLocaleTimeString()
  };
}

function buildHistory(messages) {
  return messages
    .filter((m) => m.text && m.src !== 'info')
    .map((m) => ({
      role: m.src === 'req' ? 'user' : 'assistant',
      content: m.text
    }));
}

export const useStore = create((set, get) => ({
  // Provider
  provider: 'chrome',
  session: null,
  ollamaModels: [],
  selectedOllamaModel: DEFAULT_OLLAMA_MODEL,
  ollamaConnected: false,
  modelDownloadProgress: null,

  // Companion
  selectedAssistantId: 'Aria',

  // Chat
  messages: [],

  // UI
  textInputValue: '',
  isProcessing: false,
  showNoAiError: false,
  runtimeError: null,

  // TTS
  isSpeaking: false,
  kokoroReady: false,

  // Abort
  abortController: null,

  // ─── Actions ───

  init: async () => {
    await get().selectCompanion('Aria');
  },

  selectCompanion: async (assistantId) => {
    const assistant = ASSISTANTS[assistantId];
    if (!assistant) return;

    set({
      selectedAssistantId: assistantId,
      messages: [],
      runtimeError: null,
      showNoAiError: false,
      modelDownloadProgress: null
    });

    // Apply theme
    const root = document.documentElement;
    root.style.setProperty('--accent', assistant.color);
    root.style.setProperty('--accent-bg', assistant.colorBg);
    root.style.setProperty('--accent-border', assistant.colorBorder);
    root.style.setProperty('--gradient', assistant.gradient);

    try {
      const { provider } = get();

      if (provider === 'chrome') {
        const availability = await ChromePromptClient.availability();
        if (availability === 'unavailable') {
          set({ showNoAiError: true, isProcessing: false });
          return;
        }

        // Destroy old session
        get().session?.destroy();

        const progressCb =
          availability === 'downloading' ? (p) => set({ modelDownloadProgress: p }) : null;

        const session = await ChromePromptClient.createSession({
          systemPrompt: assistant.description,
          onProgress: progressCb
        });

        set({ session, modelDownloadProgress: null });

        if (availability === 'available') {
          get().sendMessage(GREETING_PROMPT);
        }
      } else {
        const available = await OllamaClient.availability();
        if (available === 'available') {
          const session = await OllamaClient.createSession({
            systemPrompt: assistant.description,
            model: get().selectedOllamaModel
          });
          set({ session, ollamaConnected: true });
          get().sendMessage(GREETING_PROMPT);
        } else {
          set({ ollamaConnected: false, isProcessing: false });
        }
      }
    } catch (err) {
      console.error(err);
      set({ runtimeError: String(err), isProcessing: false });
    }
  },

  switchProvider: async (newProvider) => {
    get().session?.destroy();

    set({
      provider: newProvider,
      session: null,
      messages: [],
      isProcessing: false,
      ollamaConnected: false
    });

    if (newProvider === 'ollama') {
      try {
        const models = await OllamaClient.listModels();
        set({
          ollamaConnected: models.length > 0,
          ollamaModels: models,
          selectedOllamaModel: models[0]?.name || DEFAULT_OLLAMA_MODEL
        });
      } catch {
        set({ ollamaConnected: false, ollamaModels: [] });
      }
    }

    get().selectCompanion(get().selectedAssistantId);
  },

  sendMessage: async (text) => {
    const state = get();
    if (!text?.trim() || state.isProcessing) return;
    if (text.length > MAX_INPUT_LENGTH) {
      set({ runtimeError: `Message too long (max ${MAX_INPUT_LENGTH} characters).` });
      return;
    }

    const userMsg = createMessageObj(text, 'req');
    set({
      messages: [...state.messages, userMsg],
      isProcessing: true,
      textInputValue: '',
      runtimeError: null
    });

    // Add processing placeholder
    set((prev) => ({
      messages: [...prev.messages, createMessageObj('processing...', 'resp')]
    }));

    const { session, provider: prov, selectedOllamaModel } = get();
    if (!session) {
      set((prev) => {
        const updated = [...prev.messages];
        updated[updated.length - 1] = createMessageObj('AI session not initialized.', 'error');
        return { messages: updated, isProcessing: false };
      });
      return;
    }

    const abortController = new AbortController();
    set({ abortController });

    try {
      if (prov === 'ollama') {
        // For Ollama, build full conversation history including system prompt
        const allMessages = [...get().messages.slice(0, -1), userMsg];
        const history = buildHistory(allMessages);
        const stream = session.promptStreaming(text, {
          model: selectedOllamaModel,
          signal: abortController.signal,
          messages: history
        });

        for await (const chunk of stream) {
          set((prev) => {
            const updated = [...prev.messages];
            updated[updated.length - 1] = createMessageObj(chunk, 'resp');
            return { messages: updated };
          });
          get()._scrollToBottom();
        }
      } else {
        // Chrome: session already has system prompt via initialPrompts
        const stream = session.promptStreaming(text);
        for await (const chunk of stream) {
          set((prev) => {
            const updated = [...prev.messages];
            updated[updated.length - 1] = createMessageObj(chunk, 'resp');
            return { messages: updated };
          });
          get()._scrollToBottom();
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      set((prev) => {
        const updated = [...prev.messages];
        updated[updated.length - 1] = createMessageObj(
          `${prov === 'ollama' ? 'Ollama' : 'AI'} error: ${err.message}`,
          'error'
        );
        return { messages: updated };
      });
    } finally {
      set({ isProcessing: false, abortController: null });
      setTimeout(() => {
        document.getElementById('chat-input')?.focus();
      }, FOCUS_TIMEOUT);
    }
  },

  cancelRequest: () => {
    get().abortController?.abort();
    set({ isProcessing: false, abortController: null, textInputValue: '' });
    setTimeout(() => {
      document.getElementById('chat-input')?.focus();
    }, FOCUS_TIMEOUT);
  },

  refreshOllamaModels: async () => {
    try {
      const models = await OllamaClient.listModels();
      set({
        ollamaConnected: models.length > 0,
        ollamaModels: models,
        selectedOllamaModel: models[0]?.name || DEFAULT_OLLAMA_MODEL
      });
    } catch {
      set({ ollamaConnected: false, ollamaModels: [] });
    }
  },

  // TTS
  speakMessage: async (text) => {
    const { selectedAssistantId, isSpeaking } = get();
    if (isSpeaking) {
      stopSpeaking();
      set({ isSpeaking: false });
      return;
    }

    const assistant = ASSISTANTS[selectedAssistantId];
    try {
      if (!isTTSReady()) await initTTS();
      set({ isSpeaking: true });
      await speak(text, assistant?.voiceStyle || 'default');
      set({ isSpeaking: false });
    } catch (err) {
      console.error('TTS error:', err);
      set({ isSpeaking: false });
    }
  },

  stopSpeaking: () => {
    stopSpeaking();
    set({ isSpeaking: false });
  },

  initTTS: async () => {
    try {
      await initTTS();
      set({ kokoroReady: true });
    } catch {
      set({ kokoroReady: false });
    }
  },

  copyMessage: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  },

  exportChat: () => {
    const { messages } = get();
    let result = '';
    messages.forEach((m) => {
      result += `[${m.timestamp}, ${m.src}]\n${m.text}\n\n`;
    });
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexichat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  setTextInputValue: (v) => set({ textInputValue: v }),
  setSelectedOllamaModel: (m) => set({ selectedOllamaModel: m }),
  dismissError: () => set({ runtimeError: null }),

  _scrollToBottom: () => {
    const el = document.getElementById('chat-container');
    el?.scroll({ top: el.scrollHeight, behavior: 'smooth' });
  }
}));
