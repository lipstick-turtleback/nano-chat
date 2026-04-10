function CompanionCard({ assistant, isActive, onSelect, disabled }) {
  return (
    <label
      className={`companion-radio-card ${isActive ? 'active' : ''}`}
      style={
        isActive
          ? {
              '--accent': assistant.color,
              '--accent-bg': assistant.colorBg,
              '--accent-border': assistant.colorBorder
            }
          : {}
      }
    >
      <input
        type="radio"
        name="companion"
        value={assistant.id}
        checked={isActive}
        onChange={() => onSelect(assistant.id)}
        disabled={disabled}
      />
      <span className="companion-emoji" aria-hidden="true">
        {assistant.emoji}
      </span>
      <div className="companion-info">
        <span className="companion-name">{assistant.shortName}</span>
        <span className="companion-tagline">{assistant.tagline}</span>
      </div>
    </label>
  );
}

export default CompanionCard;
