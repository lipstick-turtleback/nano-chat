function ErrorScreen() {
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">🧠</div>
        <h1>No AI Provider Available</h1>
        <p>
          This app needs either Chrome 131+ with Gemini Nano or a local Ollama
          instance.
        </p>
        <div className="error-links">
          <a
            href="https://developer.chrome.com/docs/ai/built-in"
            target="_blank"
            rel="noopener noreferrer"
            className="error-link"
          >
            📖 Chrome AI Setup
          </a>
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="error-link"
          >
            🦙 Get Ollama
          </a>
        </div>
      </div>
    </div>
  );
}

export default ErrorScreen;
