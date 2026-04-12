import { useState } from 'react';

/**
 * DnD Narrative Scene Card — story text with action choices
 */
function DnDSceneCard({ content, onSubmit }) {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [customAction, setCustomAction] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const choices = content.choices || [];
  const hasChoices = choices.length > 0;

  const handleSubmit = (choiceIndex) => {
    if (submitted) return;
    setSubmitted(true);
    setSelectedChoice(choiceIndex);
    onSubmit?.({
      type: 'choice',
      choiceIndex,
      choice: choices[choiceIndex],
      customAction: null
    });
  };

  const handleCustomSubmit = () => {
    if (submitted || !customAction.trim()) return;
    setSubmitted(true);
    onSubmit?.({
      type: 'custom',
      choiceIndex: null,
      choice: null,
      customAction: customAction.trim()
    });
  };

  return (
    <div className="tool-card dnd-scene-card">
      <div className="tool-card-header">
        <span className="tool-badge">🎲</span>
        <h4>{content.title || 'Adventure Scene'}</h4>
      </div>

      {/* Scene narrative */}
      {content.narrative && (
        <div className="dnd-narrative">
          {content.narrative}
        </div>
      )}

      {content.situation && (
        <div className="dnd-situation">
          <strong>Current Situation:</strong> {content.situation}
        </div>
      )}

      {/* Suggested choices */}
      {hasChoices && (
        <div className="dnd-choices">
          <p className="dnd-choices-label">What do you do?</p>
          {choices.map((choice, i) => (
            <button
              key={choice.id || i}
              type="button"
              className={`dnd-choice-btn ${submitted && selectedChoice === i ? 'chosen' : ''} ${submitted && selectedChoice !== i ? 'faded' : ''}`}
              onClick={() => handleSubmit(i)}
              disabled={submitted}
            >
              <span className="dnd-choice-letter">{String.fromCharCode(65 + i)}</span>
              <span className="dnd-choice-text">{choice.text}</span>
              {choice.dc && <span className="dnd-choice-dc">DC {choice.dc}</span>}
              {submitted && selectedChoice === i && <span className="dnd-choice-badge">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Custom action input */}
      {!submitted && (
        <div className="dnd-custom-action">
          <label className="dnd-custom-label">
            Or describe your own action:
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
    </div>
  );
}

export default DnDSceneCard;
