import { create } from 'zustand';
import { ChromePromptClient } from '../ai/ChromePromptClient';
import { OllamaClient } from '../ai/OllamaClient';
import {
  ASSISTANTS,
  FOCUS_TIMEOUT,
  MAX_INPUT_LENGTH,
  DEFAULT_OLLAMA_MODEL
} from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';
import { saveKnowledge, buildKnowledgeContext } from '../services/knowledgeService';
import {
  getCompanionProgress,
  updateCompanionProgress,
  addAchievement
} from '../services/playerStats';
import { pickRandomThemes } from '../utils/themeEngine';
import { TOOL_REFERENCE } from '../utils/toolReference';
import { getCachedChallenge, cacheChallenge } from '../services/challengeCache';
import { generateStartingPassives, autoRollPassive } from '../dnd/passiveSkills';
import { createCampaign } from '../dnd/campaignState';
import { buildDnDPrompt, buildDnDInitialPrompt as _buildDnDInitialPrompt } from '../dnd/dnDPromptBuilder';
import { parseDnDResponse } from '../dnd/dnDResponseParser';
import { applyDnDResponse } from '../dnd/dnDStateApplier';

const API = '/api';

// Save DnD campaign state to localStorage
function saveCampaign(campaign, character) {
  try {
    localStorage.setItem('lexichat_dnd_campaign', JSON.stringify({ campaign, character }));
  } catch (err) {
    console.error('Failed to save DnD campaign:', err);
  }
}

// Pick a random greeting from the companion's greeting variations
function pickGreeting(assistant) {
  const greetings = assistant.greetingVariations;
  if (!greetings || greetings.length === 0) return 'Hello! How can I help you today?';
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// Load settings from localStorage
function loadSettings() {
  try {
    const raw = localStorage.getItem('lexichat_settings');
    return raw
      ? JSON.parse(raw)
      : {
          fontSize: 16,
          darkMode: false
        };
  } catch {
    return {
      fontSize: 16,
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
    .filter((m) => m.text && m.src !== 'info' && m.src !== 'dice' && m.text !== 'processing...' && m.src !== 'error')
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

  // DnD campaign state (persisted in localStorage)
  dndCampaign: null,
  dndCharacter: null,

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

    // Initialize DnD campaign if Mira is selected and no campaign exists
    let dndCampaign = get().dndCampaign;
    let dndCharacter = get().dndCharacter;
    if (assistantId === 'Mira' && !dndCampaign) {
      // Load or create campaign from localStorage
      try {
        const raw = localStorage.getItem('lexichat_dnd_campaign');
        if (raw) {
          const saved = JSON.parse(raw);
          dndCampaign = saved.campaign;
          dndCharacter = saved.character;
        } else {
          // Create new campaign with random character
          const newCampaign = createCampaign();
          const character = newCampaign.character;
          // Add passive skills
          character.passives = generateStartingPassives(character.race);
          dndCampaign = newCampaign;
          dndCharacter = character;
          // Save
          localStorage.setItem('lexichat_dnd_campaign', JSON.stringify({ campaign: dndCampaign, character: dndCharacter }));
        }
      } catch (err) {
        console.error('Failed to load DnD campaign:', err);
      }
    }

    set({
      selectedAssistantId: assistantId,
      messages: [],
      runtimeError: null,
      showNoAiError: false,
      modelDownloadProgress: null,
      isInitializing: true,
      messagesThisSession: 0,
      knowledgeExtracted: false,
      companionProgress, // Store for RightPanel
      dndCampaign,
      dndCharacter
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
          get().sendMessage(pickGreeting(assistant));
        }
      } else {
        const available = await OllamaClient.availability();
        if (available === 'available') {
          const session = await OllamaClient.createSession({
            systemPrompt,
            model: get().selectedOllamaModel
          });
          set({ session, ollamaConnected: true, isInitializing: false });
          get().sendMessage(pickGreeting(assistant));
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

  // Internal: stream AI response and REPLACE a specific message (for DnD dice → narrative)
  _streamDnDResponse: async (diceMsgId, promptText) => {
    if (!promptText?.trim()) return;

    const { session, provider: prov, selectedOllamaModel } = get();
    if (!session) return;

    // Add processing placeholder AFTER the dice message, capture its ID
    const procId = `proc-${Date.now()}`;
    const processingMsg = { ...createMessageObj('processing...', 'resp'), id: procId };

    set((prev) => {
      const updated = [...prev.messages, processingMsg];
      return { messages: updated, isProcessing: true };
    });

    const abortController = new AbortController();
    set({ abortController });

    // Helper: finalize by removing dice msg + processing msg, rendering final text
    const finalizeResponse = (finalText) => {
      set((prev) => {
        const updated = prev.messages
          .filter(m => m.id !== diceMsgId && m.id !== procId); // Remove dice + processing
        // Add the final rendered message
        updated.push({
          id: `resp-${Date.now()}`,
          src: 'resp',
          text: finalText,
          formattedText: renderMarkdown(finalText),
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: false
        });
        return { messages: updated, isProcessing: false };
      });
    };

    try {
      if (prov === 'ollama') {
        // Build history excluding dice and processing messages
        const allMessages = get().messages.filter(m => m.id !== diceMsgId && m.id !== procId);
        const history = buildHistory(allMessages);
        const stream = session.promptStreaming(promptText, {
          model: selectedOllamaModel,
          signal: abortController.signal,
          messages: history
        });

        let finalText = '';
        for await (const chunk of stream) {
          finalText = chunk;
          set((prev) => {
            const updated = [...prev.messages];
            const procIdx = updated.findIndex(m => m.id === procId);
            if (procIdx >= 0) {
              updated[procIdx] = { ...updated[procIdx], text: chunk, isStreaming: true };
            }
            return { messages: updated };
          });
          debouncedScrollToBottom();
        }
        finalizeResponse(finalText);
      } else {
        const stream = session.promptStreaming(promptText);

        let finalText = '';
        for await (const chunk of stream) {
          finalText = chunk;
          set((prev) => {
            const updated = [...prev.messages];
            const procIdx = updated.findIndex(m => m.id === procId);
            if (procIdx >= 0) {
              updated[procIdx] = { ...updated[procIdx], text: chunk, isStreaming: true };
            }
            return { messages: updated };
          });
          debouncedScrollToBottom();
        }
        finalizeResponse(finalText);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      finalizeResponse(`*AI error: ${err.message}*`);
    }
  },

  // Internal: simple stream AI response (for non-DnD tool feedback)
  _streamAiResponse: async (promptText) => {
    if (!promptText?.trim()) return;
    const { session, provider: prov, selectedOllamaModel } = get();
    if (!session) return;

    set((prev) => ({
      messages: [...prev.messages, createMessageObj('processing...', 'resp')],
      isProcessing: true
    }));

    const abortController = new AbortController();
    set({ abortController });

    try {
      if (prov === 'ollama') {
        const allMessages = get().messages.slice(0, -1);
        const history = buildHistory(allMessages);
        const stream = session.promptStreaming(promptText, {
          model: selectedOllamaModel,
          signal: abortController.signal,
          messages: history
        });

        for await (const chunk of stream) {
          set((prev) => updateMessageText(prev, prev.messages.length - 1, chunk));
          debouncedScrollToBottom();
        }
        set((prev) => finalizeMessage(prev, prev.messages.length - 1));
      } else {
        const stream = session.promptStreaming(promptText);
        for await (const chunk of stream) {
          set((prev) => updateMessageText(prev, prev.messages.length - 1, chunk));
          debouncedScrollToBottom();
        }
        set((prev) => finalizeMessage(prev, prev.messages.length - 1));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      set((prev) => {
        const updated = [...prev.messages];
        updated[updated.length - 1] = createMessageObj(`AI error: ${err.message}`, 'error');
        return { messages: updated };
      });
    } finally {
      set({ isProcessing: false, abortController: null });
    }
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

    // DnD tools → special dice + passive skills flow
    const dndTools = [
      'dnd_narrative', 'dnd_dialog', 'dnd_quest_update', 'dnd_story_event',
      'dnd_encounter', 'dnd_combat', 'dnd_combat_turn', 'dnd_skill_check',
      'dnd_loot', 'dnd_rest', 'dnd_shop', 'dnd_levelup', 'dnd_death',
      'dnd_inspiration'
    ];
    if (dndTools.includes(toolType)) {
      // Special case: inspiration award — just update counter, no dice roll
      if (toolType === 'dnd_inspiration') {
        const { dndCharacter } = get();
        const newInsp = (dndCharacter?.inspiration || 0) + 1;
        const updatedChar = { ...dndCharacter, inspiration: newInsp };
        set({ dndCharacter: updatedChar });
        saveCampaign(get().dndCampaign, updatedChar);
        return;
      }
      return get().handleDnDChoice(messageId, tool, result);
    }

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
      await get()._streamAiResponse(feedbackPrompt);
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

  // Handle DnD choice: roll dice → show animation → LLM decides outcome
  handleDnDChoice: async (messageId, tool, result) => {
    const choice = result.choice;
    const customAction = result.customAction;
    const spendInspiration = result.spendInspiration || false;
    const actionText = customAction || choice?.text || 'Unknown action';
    const actionId = customAction ? 'custom' : (choice?.id || 'unknown');

    // If this came from DnDSkillCheck, it already has a roll result — use it directly
    if (result.roll !== undefined && result.total !== undefined) {
      // Skill check already rolled — just feed result to LLM
      const rollResult = result;
      const outcomeText = rollResult.isCrit
        ? `CRITICAL SUCCESS! Natural 20! Roll: ${rollResult.roll} + ${rollResult.modifier} = ${rollResult.total} vs DC ${rollResult.dc}`
        : rollResult.isFumble
          ? `CRITICAL FAILURE! Natural 1! Roll: 1 + ${rollResult.modifier} = ${rollResult.total} vs DC ${rollResult.dc}`
          : rollResult.success
            ? `Success! Roll: ${rollResult.roll} + ${rollResult.modifier} = ${rollResult.total} vs DC ${rollResult.dc}`
            : `Failure. Roll: ${rollResult.roll} + ${rollResult.modifier} = ${rollResult.total} vs DC ${rollResult.dc}`;

      set((prev) => {
        const updated = prev.messages.map((m) => {
          if (m.id === messageId) {
            return { ...m, toolResult: { tool, result, feedback: outcomeText } };
          }
          return m;
        });
        return { messages: updated };
      });

      const { dndCampaign: _dndCampaign, dndCharacter: _dndCharacter } = get();
      const character = get().dndCharacter;
      const campaign = get().dndCampaign;

      const dndPrompt = `The player attempts a skill check.

ACTION: "${actionText}"

DICE RESULT:
${outcomeText}

CAMPAIGN CONTEXT:
- Location: ${campaign?.world?.currentLocation || 'Unknown'}
- Character: ${character?.name || 'Adventurer'} (${character?.className || 'Fighter'}, Level ${character?.level || 1})
- HP: ${character?.hp?.current || '?'}/${character?.hp?.max || '?'}

Continue the narrative based on this skill check result.`;

      try {
        await get()._streamAiResponse(dndPrompt);
      } catch (err) {
        console.error('DnD skill check failed:', err);
      }
      return;
    }

    // Normal flow: roll dice for narrative choice
    // Determine DC and modifier
    let dc = choice?.dc || 10;
    let modifier = choice?.modifier || 0;

    // For custom actions, estimate DC
    if (customAction) {
      dc = 12 + Math.floor(Math.random() * 4); // DC 12-15
      modifier = 0;
    }

    // Get character and check inspiration
    const { dndCharacter, dndCampaign: _dndCampaign } = get();
    let currentInspiration = dndCharacter?.inspiration || 0;
    let inspirationSpent = false;

    // If user chose to spend inspiration and has tokens
    if (spendInspiration && currentInspiration > 0) {
      inspirationSpent = true;
      currentInspiration -= 1;
      // Update character in store and localStorage
      set({ dndCharacter: { ...dndCharacter, inspiration: currentInspiration } });
      try {
        const raw = localStorage.getItem('lexichat_dnd_campaign');
        if (raw) {
          const saved = JSON.parse(raw);
          saved.character.inspiration = currentInspiration;
          localStorage.setItem('lexichat_dnd_campaign', JSON.stringify(saved));
        }
      } catch { /* ignore */ }
    }

    // Roll 1d20 immediately
    let naturalRoll = Math.floor(Math.random() * 20) + 1;
    let advantageRoll = null;

    // Inspiration or passive advantage: roll twice, take higher
    if (inspirationSpent) {
      advantageRoll = Math.floor(Math.random() * 20) + 1;
      naturalRoll = Math.max(naturalRoll, advantageRoll);
    }

    const total = naturalRoll + modifier;

    // Get passive skill context — map choice type + environment to triggers
    const passives = dndCharacter?.passives || [];
    // Determine context triggers based on choice type and content
    const choiceType = choice?.type || '';
    const triggers = ['always'];
    if (choiceType === 'combat' || actionText.toLowerCase().includes('attack') || actionText.toLowerCase().includes('fight')) {
      triggers.push('combat_start', 'pre_combat');
    }
    if (choiceType === 'exploration' || actionText.toLowerCase().includes('search') || actionText.toLowerCase().includes('investigate') || actionText.toLowerCase().includes('look')) {
      triggers.push('explore_environment', 'trap_environment');
    }
    if (actionText.toLowerCase().includes('dark') || actionText.toLowerCase().includes('cave') || actionText.toLowerCase().includes('tunnel')) {
      triggers.push('dark_environment');
    }
    if (actionText.toLowerCase().includes('ancient') || actionText.includes('rune') || actionText.toLowerCase().includes('magic')) {
      triggers.push('ancient_environment');
    }
    if (actionText.toLowerCase().includes('trap') || actionText.toLowerCase().includes('wire') || actionText.toLowerCase().includes('pit')) {
      triggers.push('trap_environment');
    }
    if (actionText.toLowerCase().includes('treasure') || actionText.toLowerCase().includes('loot') || actionText.toLowerCase().includes('hidden') || actionText.toLowerCase().includes('secret')) {
      triggers.push('explore_environment', 'treasure_hunter');
    }

    const activePassives = passives.filter(p => triggers.includes(p.trigger));
    const passiveNotes = [];
    let adjustedTotal = total;

    for (const p of activePassives) {
      const pr = autoRollPassive(p, { stat: modifier, speed: dndCharacter?.speed });
      if (pr?.type === 'advantage' && !inspirationSpent) {
        // Passive advantage: roll again, take higher
        const advRoll = Math.floor(Math.random() * 20) + 1;
        const newNatural = Math.max(naturalRoll, advRoll);
        adjustedTotal = newNatural + modifier;
        passiveNotes.push(`${pr.passive}: Advantage! Rolled ${naturalRoll} and ${advRoll}, took ${newNatural}`);
      } else if (pr?.type === 'info') {
        passiveNotes.push(`${pr.passive}: ${pr.description}`);
      } else if (pr?.type === 'boost') {
        adjustedTotal += pr.value;
        passiveNotes.push(`${pr.passive}: +${pr.value}`);
      }
    }

    // Insert dice animation message
    const diceNotation = choice?.dice || (customAction ? '1d20' : '1d20');
    const diceMsg = {
      id: `dice-${Date.now()}`,
      src: 'dice',
      text: JSON.stringify({
        tool: 'dice_roll',
        notation: diceNotation,
        roll: { roll: naturalRoll, advantageRoll, modifier, total: adjustedTotal },
        dc,
        action: actionText,
        inspirationSpent
      }),
      formattedText: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: false
    };

    set((prev) => {
      const updated = prev.messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            toolResult: {
              tool,
              result,
              roll: {
                roll: naturalRoll,
                advantageRoll,
                modifier,
                total: adjustedTotal,
                dc,
                isCrit: naturalRoll === 20,
                isFumble: naturalRoll === 1,
                inspirationSpent
              },
              passives: passiveNotes,
              feedback: `Rolled ${naturalRoll}${modifier >= 0 ? ` + ${modifier}` : ''} = ${adjustedTotal} vs DC ${dc}`
            }
          };
        }
        return m;
      });

      return { messages: [...updated, diceMsg], isProcessing: true };
    });

    // Build DnD prompt using the new prompt builder
    const character = get().dndCharacter;
    const campaign = get().dndCampaign;
    const assistant = ASSISTANTS['Mira'];
    const systemPrompt = assistant ? `${assistant.description}\n\n${TOOL_REFERENCE}` : '';

    const dndPrompt = buildDnDPrompt({
      actionText,
      actionId: customAction ? 'custom' : (choice?.id || 'unknown'),
      customAction: !!customAction,
      naturalRoll,
      advantageRoll: inspirationSpent ? advantageRoll : null,
      modifier,
      total: adjustedTotal,
      dc,
      diceNotation,
      isCrit: naturalRoll === 20,
      isFumble: naturalRoll === 1,
      passiveNotes,
      inspirationSpent,
      currentInspiration,
      character,
      campaign,
      systemPrompt
    });

    try {
      // Stream LLM response — replaces the dice animation with narrative
      await get()._streamDnDResponse(diceMsg.id, dndPrompt);

      // After response completes, parse the JSON and apply state changes
      const { messages } = get();
      // Find the last assistant message (the one that replaced the dice animation)
      const lastResp = [...messages].reverse().find((m) => m.src === 'resp' && m.text && m.text !== 'processing...');
      if (lastResp?.text) {
        const parsed = parseDnDResponse(lastResp.text);

        // Apply system events to character/campaign
        const { dndCharacter: prevChar, dndCampaign: prevCampaign } = get();
        const { character: updatedChar, campaign: updatedCampaign, notifications } = applyDnDResponse(
          parsed,
          { dndCharacter: prevChar, dndCampaign: prevCampaign }
        );

        // Update store state
        set({
          dndCharacter: updatedChar,
          dndCampaign: updatedCampaign
        });

        // Render notifications as info messages
        for (const notif of notifications) {
          set((prev) => ({
            messages: [...prev.messages, createMessageObj(notif.message, 'info')]
          }));
        }

        // Save campaign to localStorage
        saveCampaign(updatedCampaign, updatedChar);
      }
    } catch (err) {
      console.error('DnD narrative failed:', err);
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

  // Generate a creative challenge from random themes
  requestChallenge: async () => {
    const { selectedAssistantId, isProcessing, session, provider: prov, selectedOllamaModel } = get();
    if (isProcessing) return;

    const assistant = ASSISTANTS[selectedAssistantId];
    const preferredTypes = assistant?.challengeTypes || ['quiz', 'true_false', 'fill_blank'];
    const chosenType = preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
    const themes = pickRandomThemes();
    const cacheKey = `${chosenType}:${themes.sort().join(',')}`;
    const cached = getCachedChallenge(cacheKey);

    if (cached) {
      get()._deliverChallenge(cached, cacheKey);
      return;
    }

    set({
      messages: [
        ...get().messages,
        createMessageObj(`Generating a creative challenge with: ${themes.join(', ')}...`, 'info')
      ],
      isProcessing: true
    });

    // Try server first, fall back to direct AI client
    try {
      const res = await fetch(`${API}/challenges/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: selectedAssistantId,
          themes,
          challengeType: chosenType
        })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const challenge = await res.json();
      cacheChallenge(cacheKey, challenge);
      get()._deliverChallenge(challenge, cacheKey);
    } catch {
      // Fall back to direct AI client
      try {
        if (!session) throw new Error('AI session not available');

        const themeList = themes.join('", "');
        const prompt = `Create a ${chosenType} challenge using these themes: "${themeList}".

Respond with ONLY valid JSON (no markdown, no code blocks):
{"game": "${chosenType}", "title": "Creative Challenge: ${themes.join(', ')}", "content": {...}}

For a quiz: {"prompt": "...", "options": ["A","B","C","D"], "correct": 1, "explanation": "..."}
For true_false: {"statements": [{"text": "...", "answer": true, "explanation": "..."}]} (5 statements)
For fill_blank: {"text": "Paragraph with [BLANK1], [BLANK2], [BLANK3]", "answers": ["a","b","c"], "explanation": "..."}
For word_match: {"pairs": [{"word": "...", "definition": "..."}]} (5 pairs)
For riddle: {"riddle": "...", "answer": "...", "hint": "...", "explanation": "..."}

Make it creative and educational.`;

        let fullResponse = '';
        if (prov === 'ollama') {
          const allMessages = get().messages.filter((m) => m.src !== 'info');
          const history = buildHistory(allMessages);
          const stream = session.promptStreaming(prompt, {
            model: selectedOllamaModel,
            messages: history
          });
          for await (const chunk of stream) {
            fullResponse = chunk;
          }
        } else {
          const stream = session.promptStreaming(prompt);
          for await (const chunk of stream) {
            fullResponse = chunk;
          }
        }

        // Parse JSON from response
        const jsonMatch = fullResponse.match(/\{[\s\S]*"game"\s*:[\s\S]*\}/) ||
                          fullResponse.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse challenge from AI response');

        const challenge = JSON.parse(jsonMatch[0]);
        // Normalize: game -> tool
        if (challenge.game && !challenge.tool) {
          challenge.tool = challenge.game;
        }
        cacheChallenge(cacheKey, challenge);
        get()._deliverChallenge(challenge, cacheKey);
      } catch (aiErr) {
        console.error('Challenge generation failed:', aiErr);
        set((prev) => ({
          messages: [
            ...prev.messages.filter((m) => m.src !== 'info'),
            createMessageObj(`Couldn't generate a challenge: ${aiErr.message}. Try again!`, 'error')
          ],
          isProcessing: false
        }));
      }
    }
  },

  // Internal: deliver a challenge as a chat message
  _deliverChallenge: (challenge, _cacheKey) => {
    const toolJson = {
      tool: challenge.game || challenge.tool || 'quiz',
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

    addAchievement({
      id: 'first_challenge',
      name: 'First Steps',
      description: 'Complete your first challenge',
      category: 'challenges',
      icon: '🌟',
      xpReward: 50
    });
  },

  // Compress knowledge from current session (silent, background)
  compressKnowledge: async () => {
    const { selectedAssistantId, messages, knowledgeExtracted, session, provider: prov, selectedOllamaModel } = get();
    if (knowledgeExtracted || messages.length < 10) return;

    try {
      const recentMessages = messages
        .filter((m) => m.src === 'req' || m.src === 'resp')
        .slice(-10);

      if (recentMessages.length < 5) return;

      const chatLog = recentMessages
        .map((m) => `[${m.src === 'req' ? 'User' : 'Assistant'}] ${m.text}`)
        .join('\n');

      const extractionPrompt = `Analyze the following chat conversation and extract important information about the user.

CHAT LOG:
${chatLog}

Respond with ONLY valid JSON:
{
  "interests": ["topic1"],
  "strengths": ["skill"],
  "weaknesses": ["area"],
  "goals": ["goal"],
  "achievements": ["accomplishment"],
  "preferences": { "learningStyle": "visual", "pace": "moderate", "topicsEnjoyed": [], "topicsAvoided": [] },
  "personality": { "tone": "casual", "confidence": "moderate", "humor": true },
  "progress": { "improvements": [], "recurringMistakes": [], "breakthroughs": [] },
  "nextSteps": []
}

Be specific. Only include confident information.`;

      let fullResponse = '';
      if (!session) throw new Error('AI session not available');

      if (prov === 'ollama') {
        const stream = session.promptStreaming(extractionPrompt, {
          model: selectedOllamaModel
        });
        for await (const chunk of stream) {
          fullResponse = chunk;
        }
      } else {
        const stream = session.promptStreaming(extractionPrompt);
        for await (const chunk of stream) {
          fullResponse = chunk;
        }
      }

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse knowledge JSON');

      const knowledge = JSON.parse(jsonMatch[0]);

      // Save to server if available, otherwise localStorage
      try {
        await saveKnowledge(selectedAssistantId, knowledge);
      } catch {
        // Fallback to localStorage
        try {
          const existing = localStorage.getItem(`lexichat_knowledge_${selectedAssistantId}`);
          const merged = { ...JSON.parse(existing || '{}'), ...knowledge };
          localStorage.setItem(`lexichat_knowledge_${selectedAssistantId}`, JSON.stringify(merged));
        } catch { /* ignore */ }
      }

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
