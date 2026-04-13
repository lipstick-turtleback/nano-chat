import { useState, useEffect } from 'react';

/**
 * Animated dice rolling — shows a cycling number for ~2 seconds,
  * then reveals the final roll result.
 * Stays visible until the parent removes it (when LLM responds).
 */
function DiceRollAnimation({ notation: _notation, finalRoll, modifier, onComplete }) {
  const [display, setDisplay] = useState('🎲');
  const [revealed, setRevealed] = useState(false);
  const [_done, setDone] = useState(false);

  useEffect(() => {
    const result = finalRoll || { total: Math.floor(Math.random() * 20) + 1 };
    let timer;
    let elapsed = 0;
    const duration = 2000;
    const interval = 60;

    const roll = () => {
      elapsed += interval;
      if (elapsed < duration) {
        setDisplay(String(Math.floor(Math.random() * 20) + 1));
        timer = setTimeout(roll, interval);
      } else {
        setDisplay(String(result.total));
        setRevealed(true);
        setDone(true);
        onComplete?.();
      }
    };

    timer = setTimeout(roll, interval);
    return () => clearTimeout(timer);
  }, [finalRoll, onComplete, modifier]);

  const isCrit = revealed && finalRoll?.roll === 20;
  const isFumble = revealed && finalRoll?.roll === 1;

  return (
    <div className={`dice-roll-animation ${revealed ? 'revealed' : ''} ${isCrit ? 'crit' : ''} ${isFumble ? 'fumble' : ''}`}>
      <div className="dice-container">
        <span className="dice-value">{display}</span>
        {!revealed && <span className="dice-shake">🎲</span>}
      </div>
      {revealed && finalRoll && (
        <div className="dice-result">
          <span className="dice-total">
            {finalRoll.roll}{modifier >= 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`} = {finalRoll.total}
          </span>
          {isCrit && <span className="dice-badge crit">🎉 Natural 20!</span>}
          {isFumble && <span className="dice-badge fumble">💀 Natural 1!</span>}
        </div>
      )}
      {!revealed && <span className="dice-rolling-text">Rolling...</span>}
    </div>
  );
}

export default DiceRollAnimation;
