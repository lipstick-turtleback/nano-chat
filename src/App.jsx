import { useEffect } from 'react';
import ChatContainer from './lib/components/ChatContainer';
import ChatHeader from './lib/components/ChatHeader';
import ErrorBoundary from './lib/components/ErrorBoundary';
import Sidebar from './lib/components/Sidebar';
import TextInput from './lib/components/TextInput';
import { useChatStore } from './lib/state/chatStore';

function App() {
  const {
    provider,
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
  } = useChatStore();

  useEffect(() => {
    init();
  }, [init]);

  if (showNoAiError) {
    return <ErrorBoundary />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        selectedAssistantId={selectedAssistant?.name || 'Aria'}
        onSelect={resetChat}
        disabled={disableTextInput}
        provider={provider}
        onProviderChange={switchProvider}
        ollamaConnected={ollamaConnected}
        ollamaModels={ollamaModels}
        selectedOllamaModel={selectedOllamaModel}
        onModelChange={setSelectedOllamaModel}
        onRefreshModels={refreshOllamaModels}
        ollamaLoading={ollamaLoading}
      />

      <main className="main-chat">
        <ChatHeader
          provider={provider}
          ollamaConnected={ollamaConnected}
          selectedOllamaModel={selectedOllamaModel}
          downloadProgress={modelDownloadProgress}
          onCancel={disableTextInput ? cancelRequest : null}
        />

        {runtimeError && (
          <div className="runtime-error-banner">
            <span>{runtimeError}</span>
            <button
              type="button"
              className="dismiss-error"
              onClick={() => setRuntimeError(null)}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        <ChatContainer
          messages={messages}
          containerRef={chatContainerRef}
          onCopy={handleCopy}
          onPlay={handlePlayText}
          isSpeaking={alreadySpeaking}
          assistant={selectedAssistant}
        />

        <TextInput
          value={textInputValue}
          onChange={setTextInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onCancel={cancelRequest}
          inputRef={textInputRef}
          disabled={false}
          isLoading={disableTextInput}
        />
      </main>
    </div>
  );
}

export default App;
