import { getModifier } from '../dnd/campaignState';

/**
 * DnD Character Sheet Widget — compact card showing stats, HP, AC
 */
function DnDCharacterSheet({ character }) {
  if (!character) return null;

  const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const statShort = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' };

  const hpPercent = Math.round((character.hp.current / character.hp.max) * 100);
  const xpPercent = Math.round((character.xp / (character.xpToNext || 300)) * 100);

  return (
    <div className="dnd-character-sheet">
      <div className="dnd-char-header">
        <span className="dnd-char-emoji">⚔️</span>
        <div className="dnd-char-info">
          <span className="dnd-char-name">{character.name}</span>
          <span className="dnd-char-class">{character.className} · Level {character.level}</span>
        </div>
      </div>

      {/* HP Bar */}
      <div className="dnd-bar-container">
        <span className="dnd-bar-label">HP</span>
        <div className="dnd-bar-track">
          <div
            className={`dnd-bar-fill ${hpPercent < 30 ? 'critical' : hpPercent < 60 ? 'warning' : ''}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="dnd-bar-value">{character.hp.current}/{character.hp.max}</span>
      </div>

      {/* XP Bar */}
      <div className="dnd-bar-container">
        <span className="dnd-bar-label">XP</span>
        <div className="dnd-bar-track">
          <div className="dnd-bar-fill xp" style={{ width: `${xpPercent}%` }} />
        </div>
        <span className="dnd-bar-value">{character.xp}/{character.xpToNext || 300}</span>
      </div>

      {/* Core Stats */}
      <div className="dnd-core-stats">
        <div className="dnd-stat">
          <span className="dnd-stat-label">AC</span>
          <span className="dnd-stat-value">{character.ac}</span>
        </div>
        <div className="dnd-stat">
          <span className="dnd-stat-label">Speed</span>
          <span className="dnd-stat-value">{character.speed}</span>
        </div>
        <div className="dnd-stat">
          <span className="dnd-stat-label">Init</span>
          <span className="dnd-stat-value">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
        </div>
        <div className="dnd-stat">
          <span className="dnd-stat-label">Gold</span>
          <span className="dnd-stat-value">💰 {character.gold}</span>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="dnd-ability-scores">
        {statNames.map((stat) => {
          const val = character.stats[stat];
          const mod = getModifier(val);
          return (
            <div key={stat} className="dnd-ability" title={`${stat}: ${val}`}>
              <span className="dnd-ability-short">{statShort[stat]}</span>
              <span className="dnd-ability-value">{val}</span>
              <span className="dnd-ability-mod">{mod >= 0 ? `+${mod}` : mod}</span>
            </div>
          );
        })}
      </div>

      {/* Inventory preview */}
      {character.inventory && character.inventory.length > 0 && (
        <div className="dnd-inventory">
          <span className="dnd-inv-title">🎒 Items</span>
          <div className="dnd-inv-items">
            {character.inventory.slice(0, 6).map((item, i) => (
              <span key={i} className="dnd-inv-item" title={item.name}>
                {item.uses > 0 ? `${item.name} (${item.uses})` : item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DnDCharacterSheet;
