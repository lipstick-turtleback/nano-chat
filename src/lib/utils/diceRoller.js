/**
 * Dice Roller — supports standard DnD notation
 * Examples: 1d20, 2d6+3, 4d6kh3, 1d100
 */

function parseDiceNotation(notation) {
  // Match: NdN[+-M][khN]
  const match = notation.match(/^(\d+)d(\d+)(?:([+-]\d+))?(?:kh(\d+))?$/i);
  if (!match) throw new Error(`Invalid dice notation: ${notation}`);

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
    keepHighest: match[4] ? parseInt(match[4], 10) : null
  };
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll dice with given notation
 * @param {string} notation - e.g., "1d20", "2d6+3", "4d6kh3"
 * @param {string} label - Optional description
 * @returns {{ notation, label, rolls, modifier, total, breakdown, isCrit, isFumble }}
 */
export function roll(notation, label = '') {
  const { count, sides, modifier, keepHighest } = parseDiceNotation(notation);

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }

  let keptRolls = rolls;
  if (keepHighest && rolls.length > keepHighest) {
    keptRolls = [...rolls].sort((a, b) => b - a).slice(0, keepHighest);
  }

  const rollSum = keptRolls.reduce((sum, r) => sum + r, 0);
  const total = rollSum + modifier;

  // Build breakdown string
  let breakdown = keptRolls.join(' + ');
  if (modifier > 0) breakdown += ` + ${modifier}`;
  else if (modifier < 0) breakdown += ` - ${Math.abs(modifier)}`;
  breakdown += ` = ${total}`;

  if (rolls.length > keptRolls.length) {
    const dropped = rolls.filter((r) => !keptRolls.includes(r));
    breakdown += ` (dropped ${dropped.join(', ')})`;
  }

  // Critical hit/fumble detection (only for single d20)
  const isCrit = count === 1 && sides === 20 && rolls[0] === 20;
  const isFumble = count === 1 && sides === 20 && rolls[0] === 1;

  return {
    notation,
    label,
    rolls,
    modifier,
    total,
    breakdown,
    isCrit,
    isFumble
  };
}

/**
 * Roll d20 + modifier vs DC
 * @param {number} modifier
 * @param {number} dc
 * @param {string} label
 * @returns {{ roll, modifier, total, dc, success, isCrit, isFumble, breakdown }}
 */
export function rollCheck(modifier, dc, label = '') {
  const result = roll('1d20', label);
  return {
    ...result,
    dc,
    success: result.total >= dc,
    isCrit: result.isCrit,
    isFumble: result.isFumble
  };
}
