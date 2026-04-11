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
import { loadKnowledge, saveKnowledge, buildKnowledgeContext } from '../services/knowledgeService';
import {
  loadPlayerData,
  savePlayerData,
  getCompanionProgress,
  updateCompanionProgress
} from '../services/playerStats';
import { pickRandomThemes } from '../utils/themeEngine';

const API = '/api';

const nextId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function createMessageObj(text, srcType = 'resp') {
  return {
    id: nextId(),
    src: srcType,
    text,
    formattedText: text === 'processing...' ? '' : renderMarkdown(text),
    timestamp: new Date().toLocaleTimeString(),
    isStreaming: false
  };
}

// During streaming, update only the raw text.
// Markdown is NOT re-parsed until the stream completes.
function updateMessageText(prev, index, text) {
  const updated = [...prev.messages];
  updated[index] = { ...updated[index], text, isStreaming: true };
  return { messages: updated };
}

// Finalize a streaming message — render markdown once
function finalizeMessage(prev, index) {
  const updated = [...prev.messages];
  const msg = updated[index];
  updated[index] = { ...msg, formattedText: renderMarkdown(msg.text), isStreaming: false };
  return { messages: updated };
}

function buildHistory(messages) {
  return messages
    .filter((m) => m.text && m.src !== 'info')
    .map((m) => ({
      role: m.src === 'req' ? 'user' : 'assistant',
      content: m.text
    }));
}

// Scroll debounce — prevents layout thrashing during streaming
let scrollTimeout = null;
function debouncedScrollToBottom() {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    const el = document.getElementById('chat-container');
    el?.scroll({ top: el.scrollHeight, behavior: 'smooth' });
  }, 80);
}

export const useStore = create((set, get) => ({
  // Provider
  provider: 'ollama',
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
  isInitializing: true,
  isProcessing: false,
  showNoAiError: false,
  runtimeError: null,
  lastCopiedId: null,

  // Settings
  settings: {
    fontSize: 16
  },
  showSettings: false,

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
      modelDownloadProgress: null,
      isInitializing: true
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

        set({ session, modelDownloadProgress: null, isInitializing: false });

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
          set({ session, ollamaConnected: true, isInitializing: false });
          get().sendMessage(GREETING_PROMPT);
        } else {
          set({ ollamaConnected: false, isProcessing: false, isInitializing: false });
        }
      }
    } catch (err) {
      console.error(err);
      set({ runtimeError: String(err), isProcessing: false, isInitializing: false });
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
      runtimeError: null,
      lastCopiedId: null
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
        // Build conversation history from all messages except the processing placeholder
        const allMessages = get().messages.slice(0, -1);
        const history = buildHistory(allMessages);
        const stream = session.promptStreaming(text, {
          model: selectedOllamaModel,
          signal: abortController.signal,
          messages: history
        });

        for await (const chunk of stream) {
          set((prev) => updateMessageText(prev, prev.messages.length - 1, chunk));
          debouncedScrollToBottom();
        }
        // Stream complete — render markdown once
        set((prev) => finalizeMessage(prev, prev.messages.length - 1));
      } else {
        // Chrome: session already has system prompt via initialPrompts
        const stream = session.promptStreaming(text);
        for await (const chunk of stream) {
          set((prev) => updateMessageText(prev, prev.messages.length - 1, chunk));
          debouncedScrollToBottom();
        }
        // Stream complete — render markdown once
        set((prev) => finalizeMessage(prev, prev.messages.length - 1));
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
    set({ isProcessing: false, abortController: null });
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

  copyMessage: async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      set({ lastCopiedId: messageId });
      // Reset copy state after 2 seconds
      setTimeout(() => {
        set({ lastCopiedId: null });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  },

  exportChat: () => {
    try {
      const { messages } = get();
      if (messages.length === 0) return;

      let result = '';
      messages.forEach((m) => {
        result += `[${m.timestamp}, ${m.src}]\n${m.text}\n\n`;
      });
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lexichat-export-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      set({ runtimeError: 'Failed to export chat. Please try again.' });
    }
  },

  clearChat: () => set({ messages: [], runtimeError: null, lastCopiedId: null }),

  setTextInputValue: (v) => set({ textInputValue: v }),
  setSelectedOllamaModel: (m) => set({ selectedOllamaModel: m }),
  dismissError: () => set({ runtimeError: null }),

  // Handle interactive tool submission (quiz answer, etc.)
  handleToolSubmit: (messageId, tool, result) => {
    // Log result for future knowledge compression
    const feedback =
      result.isCorrect !== undefined
        ? result.isCorrect
          ? '🎉 Correct!'
          : `Not quite. ${tool.content?.explanation || ''}`
        : `You got ${result.correctCount || 0}/${result.total || tool.content?.pairs?.length || '?'} right!`;

    // Append a subtle system note to the message for context
    set((prev) => {
      const updated = prev.messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            toolResult: { tool, result, feedback }
          };
        }
        return m;
      });
      return { messages: updated };
    });
  },

  // Settings
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  updateSettings: (newSettings) => {
    set((prev) => {
      const settings = { ...prev.settings, ...newSettings };
      // Apply font size immediately
      if (newSettings.fontSize) {
        document.documentElement.style.fontSize = `${newSettings.fontSize}px`;
      }
      return { settings, showSettings: false };
    });
  },

  // Generate a creative challenge from 3 random themes
  requestChallenge: async () => {
    const { selectedAssistantId, isProcessing } = get();
    if (isProcessing) return;

    // Pick 3 random themes
    const themes = pickRandomThemes(3);

    // Add a "generating..." message
    set({
      messages: [
        ...get().messages,
        createMessageObj(`Generating a creative challenge with: ${themes.join(', ')}...`, 'info')
      ],
      isProcessing: true
    });

    try {
      const res = await fetch(`${API}/challenges/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: selectedAssistantId,
          themes
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const challenge = await res.json();

      // Insert challenge as JSON in the message
      const challengeMsg = createMessageObj(
        `Here's a creative challenge for you!\n\n\`\`\`json\n${JSON.stringify(challenge, null, 2)}\n\`\`\``,
        'resp'
      );

      set((prev) => ({
        messages: [...prev.messages.filter((m) => m.src !== 'info'), challengeMsg],
        isProcessing: false
      }));
    } catch (err) {
      console.error('Challenge generation failed:', err);
      set((prev) => ({
        messages: [
          ...prev.messages.filter((m) => m.src !== 'info'),
          createMessageObj(`Couldn't generate a challenge: ${err.message}. Try again!`, 'error')
        ],
        isProcessing: false
      }));
    }
  },

  _scrollToBottom: () => {
    const el = document.getElementById('chat-container');
    el?.scroll({ top: el.scrollHeight, behavior: 'smooth' });
  }
}));
