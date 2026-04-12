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
  updateCompanionProgress,
  addAchievement
} from '../services/playerStats';
import { pickRandomThemes } from '../utils/themeEngine';
import { TOOL_REFERENCE } from '../utils/toolReference';
import { getCachedChallenge, cacheChallenge } from '../services/challengeCache';

const API = '/api';

// Load settings from localStorage
function loadSettings() {
  try {
    const raw = localStorage.getItem('lexichat_settings');
    return raw
      ? JSON.parse(raw)
      : {
          fontSize: 16,
          speechEngine: 'browser',
          voiceStyle: 'default',
          autoSpeak: false,
          darkMode: false
        };
  } catch {
    return {
      fontSize: 16,
      speechEngine: 'browser',
      voiceStyle: 'default',
      autoSpeak: false,
      darkMode: false
    };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('lexichat_settings', JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

// Build system prompt with tool awareness
function buildSystemPrompt(assistantDescription) {
  return `${assistantDescription}\n\n${TOOL_REFERENCE}`;
}

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
  selectedAssistantId: 'Mira',

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
  settings: loadSettings(),
  showSettings: false,

  // Tracking
  messagesThisSession: 0,
  knowledgeExtracted: false,
  companionProgress: null, // Current companion's progress data

  // Abort
  abortController: null,

  // ─── Actions ───

  init: async () => {
    await get().selectCompanion('Mira');
  },

  selectCompanion: async (assistantId) => {
    const assistant = ASSISTANTS[assistantId];
    if (!assistant) return;

    // Load companion-specific knowledge (silent, no chat message)
    const knowledgeContext = await buildKnowledgeContext(assistantId);

    // Load companion progress
    const companionProgress = getCompanionProgress(assistantId);

    set({
      selectedAssistantId: assistantId,
      messages: [],
      runtimeError: null,
      showNoAiError: false,
      modelDownloadProgress: null,
      isInitializing: true,
      messagesThisSession: 0,
      knowledgeExtracted: false,
      companionProgress // Store for RightPanel
    });

    // Apply theme
    const root = document.documentElement;
    root.style.setProperty('--accent', assistant.color);
    root.style.setProperty('--accent-bg', assistant.colorBg);
    root.style.setProperty('--accent-border', assistant.colorBorder);
    root.style.setProperty('--gradient', assistant.gradient);

    try {
      const { provider } = get();

      // Build system prompt with knowledge context
      const systemPrompt = knowledgeContext
        ? `${assistant.description}\n\n${knowledgeContext}\n\n${TOOL_REFERENCE}`
        : `${assistant.description}\n\n${TOOL_REFERENCE}`;

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
          systemPrompt,
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
            systemPrompt,
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
    const newMessageCount = state.messagesThisSession + 1;

    set({
      messages: [...state.messages, userMsg],
      isProcessing: true,
      textInputValue: '',
      runtimeError: null,
      lastCopiedId: null,
      messagesThisSession: newMessageCount
    });

    // Add processing placeholder
    set((prev) => ({
      messages: [...prev.messages, createMessageObj('processing...', 'resp')]
    }));

    const { session, provider: prov, selectedOllamaModel, selectedAssistantId } = get();
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

      // Trigger background knowledge extraction every 5 messages (silent)
      if (newMessageCount % 5 === 0) {
        get().compressKnowledge();
      }

      // Update companion progress
      updateCompanionProgress(selectedAssistantId, {
        totalMessages: newMessageCount
      });
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
  handleToolSubmit: async (messageId, tool, result) => {
    const toolType = tool.tool || 'challenge';

    // Build result text based on tool type
    let userResultText = '';
    let resultSrc = 'req'; // Default: appears as user message

    // For choice-based tools, use subtle info message (not a user bubble)
    if (toolType === 'would_you_rather' || toolType === 'poll') {
      resultSrc = 'info';
      const chosen = result.option || `Option ${result.selected !== undefined ? (result.selected === 0 ? 'A' : 'B') : '?'}`;
      userResultText = `Chose: ${chosen}`;
    } else if (result.isCorrect !== undefined) {
      userResultText = result.isCorrect
        ? `✅ Correct: ${tool.content?.prompt || tool.title || 'Challenge'}`
        : `❌ Not quite — ${tool.content?.explanation || ''}`;
    } else if (result.correctCount !== undefined) {
      const total = result.total || tool.content?.pairs?.length || '?';
      userResultText = result.correctCount === total
        ? `🎉 Perfect score: ${result.correctCount}/${total}!`
        : `📊 Scored ${result.correctCount}/${total}`;
    } else if (result.text) {
      userResultText = `📝 "${result.text.slice(0, 150)}${result.text.length > 150 ? '...' : ''}"`;
    } else if (result.rating) {
      userResultText = `⭐ Rated ${result.rating}/5 stars`;
    } else {
      userResultText = `✅ Completed: ${tool.title || 'Challenge'}`;
    }

    // Update the tool card with result state
    set((prev) => {
      const updated = prev.messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, toolResult: { tool, result, feedback: userResultText } };
        }
        return m;
      });

      // For choice tools, don't add a separate message bubble — just update the card
      // For other tools, add a visible result message
      if (toolType === 'would_you_rather' || toolType === 'poll') {
        return { messages: updated };
      }

      const resultMsg = createMessageObj(userResultText, resultSrc);
      return { messages: [...updated, resultMsg] };
    });

    // Send tool result to AI for personalized feedback
    const feedbackPrompt = `The user just completed a "${toolType}": "${tool.title || 'Challenge'}"\nTheir result: ${userResultText}\n\nGive 1-2 sentences of personalized feedback. If they did well, celebrate specifically. If not, encourage them and offer a hint. Keep it warm and natural.`;

    try {
      await get().sendMessage(feedbackPrompt);
    } catch (err) {
      console.error('Tool feedback failed:', err);
    }

    // Award achievement for first challenge completion
    if (!['save_memory', 'track_progress', 'storage_view', 'storage_set'].includes(toolType)) {
      addAchievement({
        id: 'first_challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        category: 'challenges',
        icon: '🌟',
        xpReward: 50
      });
    }
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
      saveSettings(settings);
      return { settings, showSettings: false };
    });
  },

  // Generate a creative challenge from 3 random themes
  requestChallenge: async () => {
    const { selectedAssistantId, isProcessing } = get();
    if (isProcessing) return;

    // Pick 2-4 random themes
    const themes = pickRandomThemes();

    // Check cache first
    const cacheKey = themes.sort().join(',');
    const cached = getCachedChallenge(cacheKey);

    if (cached) {
      // Use cached challenge
      const toolJson = {
        tool: cached.game || 'quiz',
        title: cached.title || 'Creative Challenge',
        content: cached.content || cached.params || {}
      };

      const challengeMsg = createMessageObj(
        `Here's a creative challenge for you!\n\n${JSON.stringify(toolJson)}`,
        'resp'
      );

      set((prev) => ({
        messages: [...prev.messages, challengeMsg],
        isProcessing: false
      }));

      // Award achievement for first challenge
      addAchievement({
        id: 'first_challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        category: 'challenges',
        icon: '🌟',
        xpReward: 50
      });

      return;
    }

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

      // Cache the challenge
      cacheChallenge(cacheKey, challenge);

      // Insert challenge as a raw tool JSON that ToolRenderer can detect
      // ToolRenderer expects: { tool: "quiz", content: { prompt, options, correct, ... } }
      const toolJson = {
        tool: challenge.game || 'quiz',
        title: challenge.title || 'Creative Challenge',
        content: challenge.content || challenge.params || {}
      };

      const challengeMsg = createMessageObj(
        `Here's a creative challenge for you!\n\n${JSON.stringify(toolJson)}`,
        'resp'
      );

      set((prev) => ({
        messages: [...prev.messages.filter((m) => m.src !== 'info'), challengeMsg],
        isProcessing: false
      }));

      // Award achievement for first challenge
      addAchievement({
        id: 'first_challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        category: 'challenges',
        icon: '🌟',
        xpReward: 50
      });
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

  // Compress knowledge from current session (silent, background)
  compressKnowledge: async () => {
    const { selectedAssistantId, messages, knowledgeExtracted } = get();
    if (knowledgeExtracted || messages.length < 10) return;

    try {
      // Get last 5 user+assistant messages for compression
      const recentMessages = messages
        .filter((m) => m.src === 'req' || m.src === 'resp')
        .slice(-10);

      if (recentMessages.length < 5) return;

      // Build knowledge from recent messages
      const knowledge = {
        recentTopics: recentMessages.map((m) => m.text.slice(0, 100)),
        lastInteraction: new Date().toISOString(),
        messageCount: messages.length
      };

      // Save to server (silent, no chat message)
      await saveKnowledge(selectedAssistantId, { recentActivity: knowledge });

      set({ knowledgeExtracted: true });
    } catch (err) {
      console.error('Knowledge compression failed:', err);
    }
  },

  _scrollToBottom: () => {
    const el = document.getElementById('chat-container');
    el?.scroll({ top: el.scrollHeight, behavior: 'smooth' });
  }
}));
