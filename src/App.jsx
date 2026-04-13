import { useEffect, useMemo } from 'react';
import { ASSISTANTS } from './lib/utils/constants';
import { useStore } from './lib/state/useStore';
import Sidebar from './lib/components/Sidebar';
import ChatHeader from './lib/components/ChatHeader';
import ChatArea from './lib/components/ChatArea';
import ChatInput from './lib/components/ChatInput';
import RuntimeErrorBanner from './lib/components/RuntimeErrorBanner';
import ErrorScreen from './lib/components/ErrorScreen';
import SettingsPanel from './lib/components/SettingsPanel';
import RightPanel from './lib/components/RightPanel';

/**
 * Detect if the last assistant message has an unsubmitted tool.
 */
function getActiveTool(messages) {
  if (!messages || messages.length === 0) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.src !== 'resp' || !msg.text || msg.toolResult) continue;
    try {
      const jsonMatch = msg.text.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* not a tool */ }
  }
  return null;
}

/** Friendly hint for the input placeholder based on active tool */
function getToolHint(tool) {
  if (!tool) return '';
  const hints = {
    quiz: 'Answer the quiz above ↑',
    true_false: 'Answer the true/false questions above ↑',
    fill_blank: 'Fill in the blanks above ↑',
    word_match: 'Match the words above ↑',
    riddle: 'Type your guess in the riddle above ↑',
    word_ladder: 'Solve the word ladder above ↑',
    emoji_pictionary: 'Guess the emoji puzzle above ↑',
    emoji_pict: 'Guess the emoji puzzle above ↑',
    would_you_rather: 'Choose an option above ↑',
    dice_roll: 'Click the dice above to roll ↑',
    two_truths_lie: 'Find the lie in the statements above ↑',
    sequence: 'Complete the sequence above ↑',
    anagram: 'Unscramble the word above ↑',
    reorder: 'Reorder the sentence above ↑',
    reflection: 'Write your reflection above ↑',
    poll: 'Vote in the poll above ↑',
    word_of_day: 'Click to reveal the word above ↑',
    checklist: 'Check off items above ↑',
    rating: 'Rate using the stars above ↑',
    comparison: 'Review the comparison above ↑',
    timeline: 'Review the timeline above ↑',
    code: 'Review the code above ↑',
    progress: 'Review the progress above ↑'
  };
  return hints[tool.tool] || 'Interact with the challenge above ↑';
}

function App() {
  const {
    provider,
    selectedAssistantId,
    messages,
    textInputValue,
    isInitializing,
    isProcessing,
    showNoAiError,
    runtimeError,
    lastCopiedId,
    ollamaConnected,
    ollamaModels,
    selectedOllamaModel,
    modelDownloadProgress,
    settings,
    showSettings,
    companionProgress,
    dndCampaign,
    dndCharacter,
    init,
    selectCompanion,
    switchProvider,
    sendMessage,
    cancelRequest,
    exportChat,
    clearChat,
    copyMessage,
    requestChallenge,
    setTextInputValue,
    setSelectedOllamaModel,
    refreshOllamaModels,
    dismissError,
    handleToolSubmit,
    openSettings,
    closeSettings,
    updateSettings
  } = useStore();

  useEffect(() => {
    init();
    if (settings.fontSize) {
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }
  }, [init, settings.fontSize]);

  const handleKeyDown = (e) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(textInputValue);
    }
  };

  const handleSend = () => {
    if (textInputValue.trim()) {
      sendMessage(textInputValue);
    }
  };

  const assistant = ASSISTANTS[selectedAssistantId];
  const isBusy = isInitializing || isProcessing;

  const activeTool = useMemo(() => getActiveTool(messages), [messages]);
  const toolHint = useMemo(() => getToolHint(activeTool), [activeTool]);

  if (showNoAiError) {
    return <ErrorScreen />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        selectedAssistantId={selectedAssistantId}
        onSelect={selectCompanion}
        disabled={isBusy}
        provider={provider}
        onProviderChange={switchProvider}
        ollamaConnected={ollamaConnected}
        ollamaModels={ollamaModels}
        selectedOllamaModel={selectedOllamaModel}
        onModelChange={setSelectedOllamaModel}
        onRefreshModels={refreshOllamaModels}
        ollamaLoading={false}
        onExport={exportChat}
        hasMessages={messages.length > 0}
      />

      <main className="main-chat">
        <ChatHeader
          provider={provider}
          ollamaConnected={ollamaConnected}
          selectedOllamaModel={selectedOllamaModel}
          downloadProgress={modelDownloadProgress}
          onSettingsOpen={openSettings}
        />

        {runtimeError && <RuntimeErrorBanner message={runtimeError} onDismiss={dismissError} />}

        <ChatArea
          messages={messages}
          assistant={assistant}
          onCopy={copyMessage}
          lastCopiedId={lastCopiedId}
          onToolSubmit={handleToolSubmit}
          inspiration={dndCharacter?.inspiration || 0}
        />

        <ChatInput
          value={textInputValue}
          onChange={setTextInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onCancel={cancelRequest}
          isProcessing={isProcessing}
          activeTool={activeTool}
          toolHint={toolHint}
        />
      </main>

      <RightPanel
        assistant={assistant}
        onChallenge={requestChallenge}
        isProcessing={isProcessing}
        companionProgress={companionProgress || {}}
        dndCampaign={dndCampaign}
        dndCharacter={dndCharacter}
      />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={closeSettings}
          provider={provider}
          onProviderChange={switchProvider}
          ollamaConnected={ollamaConnected}
          ollamaModels={ollamaModels}
          selectedOllamaModel={selectedOllamaModel}
          onModelChange={setSelectedOllamaModel}
          onRefreshModels={refreshOllamaModels}
          onExportChat={exportChat}
          hasMessages={messages.length > 0}
          onClearChat={clearChat}
        />
      )}
    </div>
  );
}

export default App;
