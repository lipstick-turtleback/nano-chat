import { useState } from 'react';

function DiceRoller({ content, onSubmit }) {
  const { notation = '1d20', label = '', dc = null } = content || {};
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(null);

  const handleRoll = async () => {
    setRolling(true);
    setDisplayNumber(null);

    // Animate dice rolling
    const animationDuration = 800;
    const interval = 50;
    let elapsed = 0;

    const anim = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      elapsed += interval;
      if (elapsed >= animationDuration) {
        clearInterval(anim);
      }
    }, interval);

    // Actually roll the dice
    await new Promise((r) => setTimeout(r, animationDuration + 200));

    try {
      const res = await fetch('/api/games/dice/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notation, label })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setDisplayNumber(data.rolls?.[0] || data.total);
        onSubmit?.({ roll: data, userAction: 'rolled' });
      }
    } catch {
      // Fallback: local roll
      const localRoll = Math.floor(Math.random() * 20) + 1;
      setResult({
        notation,
        label,
        rolls: [localRoll],
        modifier: 0,
        total: localRoll,
        breakdown: `${localRoll}`,
        isCrit: localRoll === 20,
        isFumble: localRoll === 1
      });
      setDisplayNumber(localRoll);
    }

    setRolling(false);
  };

  const isSuccess = dc && result && result.total >= dc;
  const isCrit = result?.isCrit;
  const isFumble = result?.isFumble;

  return (
    <div className="tool-card dice-card">
      <div className="tool-card-header">
        <span className="tool-badge">🎲</span>
        <h4>{label || notation}</h4>
      </div>

      <div className="dice-display">
        <div
          className={`dice-number ${isCrit ? 'crit' : isFumble ? 'fumble' : ''} ${rolling ? 'rolling' : ''}`}
        >
          {rolling ? '?' : (displayNumber ?? '—')}
        </div>

        {!rolling && result && dc && (
          <div className={`dice-dc ${isSuccess ? 'success' : 'failure'}`}>
            {result.total} vs DC {dc} → {isSuccess ? 'Success!' : 'Failure'}
          </div>
        )}

        {!rolling && result && !dc && <div className="dice-breakdown">{result.breakdown}</div>}
      </div>

      {!rolling && !result && (
        <button type="button" className="dice-roll-btn" onClick={handleRoll}>
          🎲 Roll {notation}
        </button>
      )}

      {rolling && <div className="dice-rolling-text">Rolling...</div>}

      {!rolling && result && (
        <button type="button" className="dice-roll-again-btn" onClick={handleRoll}>
          🎲 Roll Again
        </button>
      )}
    </div>
  );
}

export default DiceRoller;
