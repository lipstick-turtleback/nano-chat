import { useState } from 'react';
import { rollSkillCheck } from '../dnd/combat';

/**
 * DnD Skill Check Card — roll dice vs DC
 */
function DnDSkillCheck({ content, onSubmit }) {
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);

  const dc = content.dc || 10;
  const stat = content.stat || 'strength';
  const skillName = content.skill || stat.charAt(0).toUpperCase() + stat.slice(1);
  // Default modifier if not provided
  const modifier = content.modifier !== undefined ? content.modifier : 0;
  const advantage = content.advantage || false;
  const disadvantage = content.disadvantage || false;

  const handleRoll = () => {
    if (rolling || result) return;
    setRolling(true);

    // Animate rolling
    setTimeout(() => {
      const checkResult = rollSkillCheck(modifier, dc, advantage, disadvantage);
      setResult(checkResult);
      setRolling(false);
      onSubmit?.({
        roll: checkResult.roll,
        modifier,
        total: checkResult.total,
        dc,
        success: checkResult.success,
        isCrit: checkResult.isCrit,
        isFumble: checkResult.isFumble
      });
    }, 800);
  };

  return (
    <div className="tool-card dnd-skill-check">
      <div className="tool-card-header">
        <span className="tool-badge">🎯</span>
        <h4>{skillName} Check (DC {dc})</h4>
      </div>

      {content.description && (
        <p className="dnd-skill-desc">{content.description}</p>
      )}

      {!result ? (
        <div className="dnd-roll-section">
          <button
            type="button"
            className="dnd-roll-btn"
            onClick={handleRoll}
            disabled={rolling}
          >
            {rolling ? (
              <span className="dnd-rolling-anim">🎲 Rolling...</span>
            ) : (
              <>🎲 Roll 1d20 {modifier >= 0 ? `+${modifier}` : modifier}</>
            )}
          </button>
          {advantage && <span className="dnd-condition advantage">Advantage</span>}
          {disadvantage && <span className="dnd-condition disadvantage">Disadvantage</span>}
        </div>
      ) : (
        <div className={`dnd-result ${result.success ? 'success' : 'failure'}`}>
          <div className="dnd-result-dice">
            <span className={`dnd-die ${result.isCrit ? 'crit' : result.isFumble ? 'fumble' : ''}`}>
              {result.roll}
            </span>
            <span className="dnd-result-mod">{modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}</span>
            <span className="dnd-result-total">= {result.total}</span>
          </div>
          <div className="dnd-result-verdict">
            {result.isCrit && <strong className="crit-text">🎉 Natural 20! Critical Success!</strong>}
            {result.isFumble && <strong className="fumble-text">💀 Natural 1! Critical Failure!</strong>}
            {!result.isCrit && !result.isFumble && result.success && (
              <strong className="success-text">✅ Success! (met DC {dc})</strong>
            )}
            {!result.isCrit && !result.isFumble && !result.success && (
              <strong className="fail-text">❌ Failed (needed {dc}, got {result.total})</strong>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DnDSkillCheck;
