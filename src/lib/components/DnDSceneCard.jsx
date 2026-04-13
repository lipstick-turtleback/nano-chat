import { useState } from 'react';

/**
 * DnD Scene Card — Renders narrative + action buttons with stat+dice+DC.
 * Supports both new format (actions[]) and legacy format (choices[]).
 */
function DnDSceneCard({ content, onSubmit, inspiration = 0 }) {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [customAction, setCustomAction] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [spendInspiration, setSpendInspiration] = useState(false);

  // Support both new (actions) and legacy (choices) formats
  const actions = content.actions || content.choices || [];
  const hasActions = actions.length > 0;
  const canSpendInspiration = inspiration > 0 && !submitted;

  const handleSubmit = (actionIndex) => {
    if (submitted) return;
    setSubmitted(true);
    setSelectedChoice(actionIndex);
    onSubmit?.({
      type: 'choice',
      choiceIndex: actionIndex,
      choice: actions[actionIndex],
      customAction: null,
      spendInspiration: spendInspiration && inspiration > 0
    });
  };

  const handleCustomSubmit = () => {
    if (submitted || !customAction.trim()) return;
    setSubmitted(true);
    onSubmit?.({
      type: 'custom',
      choiceIndex: null,
      choice: null,
      customAction: customAction.trim(),
      spendInspiration: spendInspiration && inspiration > 0
    });
  };

  return (
    <div className="tool-card dnd-scene-card">
      <div className="tool-card-header">
        <span className="tool-badge">🎲</span>
        <h4>{content.title || 'Adventure Scene'}</h4>
        {inspiration > 0 && (
          <span className="dnd-inspiration-badge" title={`${inspiration} Inspiration tokens`}>
            ✨ {inspiration}
          </span>
        )}
      </div>

      {/* Scene narrative */}
      {content.narrative && (
        <div className="dnd-narrative">
          {content.narrative}
        </div>
      )}

      {/* Inspiration toggle */}
      {!submitted && canSpendInspiration && (
        <label className="dnd-inspiration-toggle">
          <input
            type="checkbox"
            checked={spendInspiration}
            onChange={(e) => setSpendInspiration(e.target.checked)}
          />
          <span className="toggle-label">
            ✨ Spend Inspiration for advantage (roll twice, take higher)
          </span>
        </label>
      )}

      {/* Action buttons */}
      {hasActions && (
        <div className="dnd-actions">
          <p className="dnd-actions-label">What do you do?</p>
          <div className="dnd-action-grid">
            {actions.map((action, i) => {
              const isRest = action.type === 'rest' || (action.dice === null && action.dc === null);
              return (
                <button
                  key={action.id || i}
                  type="button"
                  className={`dnd-action-btn ${isRest ? 'rest-action' : ''} ${submitted && selectedChoice === i ? 'chosen' : ''} ${submitted && selectedChoice !== i ? 'faded' : ''}`}
                  onClick={() => handleSubmit(i)}
                  disabled={submitted}
                >
                  <span className="dnd-action-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="dnd-action-info">
                    <span className="dnd-action-label">{action.label || action.text}</span>
                    {!isRest && (
                      <span className="dnd-action-stats">
                        <span className="dnd-stat stat-name">{action.stat || '?'}</span>
                        <span className="dnd-stat stat-dice">{action.dice || '1d20'}</span>
                        <span className="dnd-stat stat-dc">DC {action.dc ?? 10}</span>
                      </span>
                    )}
                    {isRest && (
                      <span className="dnd-stat stat-rest">No roll needed</span>
                    )}
                  </span>
                  {submitted && selectedChoice === i && (
                    <span className="dnd-choice-badge">
                      {spendInspiration ? '✨✓' : '✓'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom action input */}
      {!submitted && (
        <div className="dnd-custom-action">
          <label className="dnd-custom-label">
            {content.customActionHint || 'Or describe your own action:'}
          </label>
          <div className="dnd-custom-row">
            <textarea
              className="dnd-custom-input"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder='e.g., "I throw a torch at the oil spill"'
              rows={2}
            />
            <button
              type="button"
              className="dnd-submit-btn"
              onClick={handleCustomSubmit}
              disabled={!customAction.trim()}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Submitted state */}
      {submitted && (
        <div className="dnd-submitted-state">
          {selectedChoice !== null && actions[selectedChoice] && (
            <span>
              Chose: <strong>{actions[selectedChoice].label || actions[selectedChoice].text}</strong>
              {spendInspiration && <span className="dnd-spent-insp"> ✨ Inspiration spent</span>}
            </span>
          )}
          {selectedChoice === null && customAction && (
            <span>
              Custom action: <strong>"{customAction}"</strong>
              {spendInspiration && <span className="dnd-spent-insp"> ✨ Inspiration spent</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DnDSceneCard;
