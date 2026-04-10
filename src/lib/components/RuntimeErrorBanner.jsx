function RuntimeErrorBanner({ message, onDismiss }) {
  return (
    <div className="runtime-error-banner" role="status" aria-live="polite">
      <span>{message}</span>
      <button
        type="button"
        className="dismiss-error"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        &times;
      </button>
    </div>
  );
}

export default RuntimeErrorBanner;
