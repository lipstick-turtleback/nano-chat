function ErrorBoundary() {
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">🧠</div>
        <h1>Chrome AI Not Available</h1>
        <p>This app requires Chrome 131+ with Gemini Nano enabled.</p>
        <p>
          Alternatively, you can use <strong>Ollama</strong> as a local AI provider.
          <br />
          Start Ollama with: <code>ollama serve</code>
        </p>
        <div className="error-links">
          <a
            href="https://developer.chrome.com/docs/ai/built-in"
            target="_blank"
            rel="noopener noreferrer"
            className="error-link"
          >
            📖 Setup Guide
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

export default ErrorBoundary;
