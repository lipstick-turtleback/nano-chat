function ChallengeButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="challenge-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label="Generate a creative challenge"
      title="Get a random creative challenge"
    >
      🎲 Challenge
    </button>
  );
}

export default ChallengeButton;
