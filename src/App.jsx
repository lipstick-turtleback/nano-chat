import { useEffect } from 'react';
import { ASSISTANTS, MAX_INPUT_LENGTH } from './lib/utils/constants';
import { useStore } from './lib/state/useStore';
import Sidebar from './lib/components/Sidebar';
import ChatHeader from './lib/components/ChatHeader';
import ChatArea from './lib/components/ChatArea';
import ChatInput from './lib/components/ChatInput';
import RuntimeErrorBanner from './lib/components/RuntimeErrorBanner';
import ErrorScreen from './lib/components/ErrorScreen';

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
    isSpeaking,
    isTTSLoading,
    lastCopiedId,
    kokoroReady,
    ollamaConnected,
    ollamaModels,
    selectedOllamaModel,
    modelDownloadProgress,
    init,
    selectCompanion,
    switchProvider,
    sendMessage,
    cancelRequest,
    exportChat,
    copyMessage,
    speakMessage,
    setTextInputValue,
    setSelectedOllamaModel,
    refreshOllamaModels,
    dismissError,
    initTTS,
    handleToolSubmit
  } = useStore();

  useEffect(() => {
    init();
    initTTS();
  }, [init, initTTS]);

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
        />

        {runtimeError && <RuntimeErrorBanner message={runtimeError} onDismiss={dismissError} />}

        <ChatArea
          messages={messages}
          assistant={assistant}
          onCopy={copyMessage}
          onSpeak={speakMessage}
          isSpeaking={isSpeaking}
          isTTSLoading={isTTSLoading}
          lastCopiedId={lastCopiedId}
          kokoroReady={kokoroReady}
          onToolSubmit={handleToolSubmit}
        />

        <ChatInput
          value={textInputValue}
          onChange={setTextInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onCancel={cancelRequest}
          isProcessing={isProcessing}
          maxInputLength={MAX_INPUT_LENGTH}
        />
      </main>
    </div>
  );
}

export default App;
