function ChallengeButton({ onClick, disabled, companionName = 'your companion' }) {
  return (
    <button
      type="button"
      className="challenge-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Generate a creative challenge with ${companionName}`}
      title={`Get a random creative challenge from ${companionName}`}
    >
      🎲 Ask {companionName} for a challenge
    </button>
  );
}

export default ChallengeButton;
