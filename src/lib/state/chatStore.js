import { useCallback, useEffect, useRef, useState } from 'react';
import * as aiService from '../services/aiService';
import * as ollamaService from '../services/ollamaService';
import { ASSISTANTS, FOCUS_TIMEOUT, GREETING_PROMPT } from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';

const MAX_INPUT_LENGTH = 4000;

function createMessageObj(text, srcType = 'resp') {
  return {
    src: srcType,
    text,
    formattedText: renderMarkdown(text),
    timestamp: new Date().toLocaleTimeString()
  };
}

function buildConversationHistory(messages) {
  return messages
    .filter((m) => m.text && m.src !== 'info')
    .map((m) => ({
      role: m.src === 'req' ? 'user' : 'assistant',
      content: m.text
    }));
}

export function useChatStore() {
  const [provider, setProvider] = useState('chrome');
  const [selectedAssistantId, setSelectedAssistantId] = useState('Aria');
  const [selectedAssistant, setSelectedAssistant] = useState(ASSISTANTS.Aria);
  const [messages, setMessages] = useState([]);
  const [textInputValue, setTextInputValue] = useState('');
  const [disableTextInput, setDisableTextInput] = useState(true);
  const [showNoAiError, setShowNoAiError] = useState(false);
  const [runtimeError, setRuntimeError] = useState(null);
  const [alreadySpeaking, setAlreadySpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('');
  const [modelDownloadProgress, setModelDownloadProgress] = useState(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  const textInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sessionRef = useRef(null);
  const abortRef = useRef(null);
  // Always-accessible refs to avoid stale closures in async callbacks
  const messagesRef = useRef([]);
  const providerRef = useRef('chrome');
  const selectedOllamaModelRef = useRef('');
  const ollamaConnectedRef = useRef(false);
  const selectedAssistantRef = useRef(ASSISTANTS.Aria);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);
  useEffect(() => {
    selectedOllamaModelRef.current = selectedOllamaModel;
  }, [selectedOllamaModel]);
  useEffect(() => {
    ollamaConnectedRef.current = ollamaConnected;
  }, [ollamaConnected]);
  useEffect(() => {
    selectedAssistantRef.current = selectedAssistant;
  }, [selectedAssistant]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', selectedAssistant.color);
    root.style.setProperty('--accent-light', selectedAssistant.colorLight);
    root.style.setProperty('--accent-border', selectedAssistant.colorBorder);
    root.style.setProperty('--gradient', selectedAssistant.gradient);
  }, [selectedAssistant]);

  // One-time init: voices, Ollama check, cleanup
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang === 'en-US');
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    ollamaService.checkOllamaConnection().then((connected) => {
      setOllamaConnected(connected);
      if (connected) {
        ollamaService.listModels().then((models) => {
          setOllamaModels(models);
          if (models.length > 0) {
            setSelectedOllamaModel(models[0].name);
          }
        });
      }
    });

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
      abortRef.current?.abort();
      sessionRef.current?.destroy?.();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scroll({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  // Core request processor — uses refs for latest values, never stale
  const processRequest = useCallback(
    async (text, extraMessages = []) => {
      const currentProvider = providerRef.current;
      const currentModel = selectedOllamaModelRef.current;
      const currentAssistant = selectedAssistantRef.current;

      try {
        setDisableTextInput(true);
        setMessages((prev) => [...prev, createMessageObj('processing...', 'resp')]);

        if (currentProvider === 'ollama') {
          if (!currentModel) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = createMessageObj(
                'No Ollama model selected. Please select a model first.',
                'error'
              );
              return updated;
            });
            setDisableTextInput(false);
            return;
          }

          abortRef.current = new AbortController();

          // Build history from latest messages + the new user message
          const historyMessages = [...messagesRef.current, ...extraMessages];
          const conversationHistory = buildConversationHistory(historyMessages);

          // Prepend system prompt as a system-role message
          const systemMsg = { role: 'system', content: currentAssistant.description };
          conversationHistory.unshift(systemMsg);

          try {
            const stream = ollamaService.chatStream({
              model: currentModel,
              messages: conversationHistory,
              signal: abortRef.current.signal
            });

            for await (const chunk of stream) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = createMessageObj(chunk, 'resp');
                return updated;
              });
              scrollToBottom();
            }
          } catch (err) {
            if (err.name === 'AbortError') return;
            console.error(err);
            setMessages((prev) => [
              ...prev,
              createMessageObj(`Ollama error: ${err.message}`, 'error')
            ]);
          }
        } else {
          // Chrome AI
          const activeSession = sessionRef.current;
          if (!activeSession) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = createMessageObj(
                'AI session not initialized.',
                'error'
              );
              return updated;
            });
            setDisableTextInput(false);
            return;
          }

          try {
            const stream = await aiService.streamPrompt(activeSession, text);
            for await (const chunk of stream) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = createMessageObj(chunk, 'resp');
                return updated;
              });
              scrollToBottom();
            }
          } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, createMessageObj(String(err), 'error')]);
          }
        }
      } finally {
        setDisableTextInput(false);
        setTextInputValue('');
        setTimeout(() => textInputRef.current?.focus(), FOCUS_TIMEOUT);
      }
    },
    [scrollToBottom]
  );

  const init = useCallback(
    async (assistantId = 'Aria') => {
      try {
        setShowNoAiError(false);
        setRuntimeError(null);
        setMessages([]);
        setSelectedAssistantId(assistantId);
        const assistant = ASSISTANTS[assistantId];
        setSelectedAssistant(assistant);

        if (provider === 'chrome') {
          const availability = await aiService.getAiAvailability();

          if (availability === 'unavailable') {
            setShowNoAiError(true);
            return;
          }

          sessionRef.current?.destroy?.();

          const progressCb =
            availability === 'downloading'
              ? (p) => setModelDownloadProgress(p)
              : null;

          const newSession = await aiService.createAiSession(
            assistant.description,
            progressCb
          );
          sessionRef.current = newSession;
          setModelDownloadProgress(null);

          if (availability === 'available') {
            processRequest(GREETING_PROMPT);
          }
        } else {
          // Ollama
          if (ollamaConnected && selectedOllamaModel) {
            processRequest(GREETING_PROMPT);
          }
        }

        setVoices(
          window.speechSynthesis.getVoices().filter((v) => v.lang === 'en-US')
        );
      } catch (err) {
        console.error(err);
        setRuntimeError(String(err));
      }
    },
    [provider, ollamaConnected, selectedOllamaModel, processRequest]
  );

  // Shared send function — used by both Enter key and Send button
  const handleSend = useCallback(() => {
    const currentText = textInputValue;
    if (!currentText.trim() || disableTextInput) return;
    if (currentText.length > MAX_INPUT_LENGTH) {
      setRuntimeError(
        `Message too long (max ${MAX_INPUT_LENGTH} characters).`
      );
      return;
    }

    const userMsg = createMessageObj(currentText, 'req');
    setMessages((prev) => [...prev, userMsg]);
    // Pass the user message so processRequest sees it immediately via extraMessages
    processRequest(currentText, [userMsg]);
  }, [textInputValue, disableTextInput, processRequest]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.code === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const resetChat = useCallback(
    (assistantId) => {
      init(assistantId);
    },
    [init]
  );

  const switchProvider = useCallback(
    async (newProvider) => {
      setProvider(newProvider);

      if (newProvider === 'ollama') {
        sessionRef.current?.destroy?.();
        sessionRef.current = null;
        setMessages([]);

        const connected = await ollamaService.checkOllamaConnection();
        setOllamaConnected(connected);
        if (connected) {
          const models = await ollamaService.listModels();
          setOllamaModels(models);
          if (models.length > 0) {
            setSelectedOllamaModel(models[0].name);
          }
        }
      } else {
        // Switching back to Chrome — clear Ollama state
        abortRef.current?.abort();
      }

      init(selectedAssistantId);
    },
    [selectedAssistantId, init]
  );

  const refreshOllamaModels = useCallback(async () => {
    if (ollamaLoading) return;
    setOllamaLoading(true);
    try {
      const connected = await ollamaService.checkOllamaConnection();
      setOllamaConnected(connected);
      if (connected) {
        const models = await ollamaService.listModels();
        setOllamaModels(models);
        if (models.length > 0) {
          setSelectedOllamaModel(models[0].name);
        }
      }
    } finally {
      setOllamaLoading(false);
    }
  }, [ollamaLoading]);

  const cancelRequest = useCallback(() => {
    if (provider === 'ollama') {
      abortRef.current?.abort();
    }
    setDisableTextInput(false);
    setTextInputValue('');
    setTimeout(() => textInputRef.current?.focus(), FOCUS_TIMEOUT);
  }, [provider]);

  const exportChat = useCallback(() => {
    let result = '';
    messages.forEach((m) => {
      result += `[${m.timestamp}, ${m.src}]\n${m.text}\n\n`;
    });
    // Download as file
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handlePlayText = useCallback((messageObj) => {
    if (!alreadySpeaking) {
      const utterance = new SpeechSynthesisUtterance(messageObj.text);
      utterance.voice =
        window.speechSynthesis.getVoices().find((v) => v.lang === 'en-US') ||
        null;
      utterance.pitch = 1.15;
      utterance.rate = 1.15;
      utterance.onend = () => setAlreadySpeaking(false);
      utterance.onerror = () => setAlreadySpeaking(false);
      window.speechSynthesis.speak(utterance);
      setAlreadySpeaking(true);
    } else {
      window.speechSynthesis.cancel();
      setAlreadySpeaking(false);
    }
  }, [alreadySpeaking]);

  return {
    provider,
    selectedAssistantId,
    selectedAssistant,
    messages,
    textInputValue,
    disableTextInput,
    showNoAiError,
    runtimeError,
    alreadySpeaking,
    textInputRef,
    chatContainerRef,
    ollamaConnected,
    ollamaModels,
    selectedOllamaModel,
    modelDownloadProgress,
    ollamaLoading,
    init,
    handleKeyDown,
    handleSend,
    resetChat,
    switchProvider,
    refreshOllamaModels,
    cancelRequest,
    exportChat,
    handleCopy,
    handlePlayText,
    setTextInputValue,
    setSelectedOllamaModel,
    setRuntimeError
  };
}
