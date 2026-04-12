// ═══════════════════════════════════════════
// DnD Dice & Combat Utilities
// ═══════════════════════════════════════════

/**
 * Roll dice notation (e.g., "2d6+3", "1d20", "4d6kh3")
 */
export function rollDice(notation) {
  const match = notation.match(/^(\d+)d(\d+)(?:([+-]\d+))?(?:kh(\d+))?$/i);
  if (!match) return { total: 1, rolls: [1], breakdown: notation };

  const [, countStr, sidesStr, modStr, keepStr] = match;
  const count = parseInt(countStr, 10);
  const sides = parseInt(sidesStr, 10);
  const modifier = modStr ? parseInt(modStr, 10) : 0;
  const keepHighest = keepStr ? parseInt(keepStr, 10) : null;

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  let keptRolls = rolls;
  if (keepHighest && rolls.length > keepHighest) {
    keptRolls = [...rolls].sort((a, b) => b - a).slice(0, keepHighest);
  }

  const rollSum = keptRolls.reduce((sum, r) => sum + r, 0);
  const total = rollSum + modifier;

  let breakdown = keptRolls.join(' + ');
  if (modifier > 0) breakdown += ` + ${modifier}`;
  else if (modifier < 0) breakdown += ` - ${Math.abs(modifier)}`;
  breakdown += ` = ${total}`;

  if (rolls.length > keptRolls.length) {
    const dropped = rolls.filter((r) => !keptRolls.includes(r));
    breakdown += ` (dropped ${dropped.join(', ')})`;
  }

  return {
    total,
    rolls,
    modifier,
    breakdown,
    isCrit: count === 1 && sides === 20 && rolls[0] === 20,
    isFumble: count === 1 && sides === 20 && rolls[0] === 1
  };
}

/**
 * Roll a skill check: 1d20 + modifier vs DC
 */
export function rollSkillCheck(modifier, dc, advantage = false, disadvantage = false) {
  let roll1 = Math.floor(Math.random() * 20) + 1;
  let roll2 = Math.floor(Math.random() * 20) + 1;
  let finalRoll = roll1;

  if (advantage) {
    finalRoll = Math.max(roll1, roll2);
  } else if (disadvantage) {
    finalRoll = Math.min(roll1, roll2);
  }

  const total = finalRoll + modifier;
  const success = total >= dc;

  return {
    roll: finalRoll,
    modifier,
    total,
    dc,
    success,
    isCrit: finalRoll === 20,
    isFumble: finalRoll === 1,
    advantage: advantage || disadvantage,
    disadvantage
  };
}

/**
 * Roll attack: 1d20 + attack bonus vs AC
 */
export function rollAttack(attackBonus, targetAC) {
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + attackBonus;
  const hit = total >= targetAC;
  const isCrit = roll === 20;
  const isFumble = roll === 1;

  return { roll, attackBonus, total, targetAC, hit, isCrit, isFumble };
}

/**
 * Roll damage for a weapon (e.g., "1d8+3")
 */
export function rollDamage(damageNotation) {
  const result = rollDice(damageNotation);
  if (result.isCrit) {
    // Double the dice on crit
    const match = damageNotation.match(/^(\d+)d(\d+)(?:([+-]\d+))?$/i);
    if (match) {
      const extraDice = rollDice(`${match[1]}d${match[2]}`);
      result.total += extraDice.total - (result.modifier || 0);
      result.breakdown = `CRIT! ${result.breakdown} + ${extraDice.rolls.join(' + ')} = ${result.total}`;
    }
  }
  return result;
}

/**
 * Generate a random encounter based on location and danger level
 */
export function generateEncounter(location, dangerLevel) {
  const tables = {
    dungeon: [
      { range: [1, 3], type: 'combat', enemies: ['goblin'], name: 'Goblin Patrol' },
      { range: [4, 6], type: 'trap', dc: 12 + dangerLevel, name: 'Hidden Pit Trap' },
      { range: [7, 9], type: 'combat', enemies: ['skeleton'], name: 'Undead Guardians' },
      { range: [10, 12], type: 'treasure', name: 'Forgotten Treasure Cache' },
      { range: [13, 15], type: 'puzzle', dc: 13 + dangerLevel, name: 'Ancient Riddle Door' },
      { range: [16, 18], type: 'npc', name: 'Trapped Miner' },
      { range: [19, 19], type: 'combat', enemies: ['ogre'], name: 'Ogre Guardian' },
      { range: [20, 20], type: 'rest', name: 'Safe Haven' }
    ],
    forest: [
      { range: [1, 4], type: 'combat', enemies: ['wolf'], name: 'Wolf Pack' },
      { range: [5, 8], type: 'combat', enemies: ['bandit'], name: 'Bandit Ambush' },
      { range: [9, 12], type: 'event', name: 'Fairy Circle' },
      { range: [13, 16], type: 'npc', name: 'Lost Traveler' },
      { range: [17, 19], type: 'combat', enemies: ['bear'], name: 'Angry Bear' },
      { range: [20, 20], type: 'location', name: 'Ancient Ruins' }
    ],
    village: [
      { range: [1, 5], type: 'npc', name: 'Villager with Quest' },
      { range: [6, 10], type: 'shop', name: 'Market Day' },
      { range: [11, 15], type: 'event', name: 'Festival' },
      { range: [16, 20], type: 'rest', name: 'Peaceful Day' }
    ]
  };

  const table = tables[location] || tables.dungeon;
  const roll = Math.floor(Math.random() * 20) + 1;

  const entry = table.find((e) => roll >= e.range[0] && roll <= e.range[1]);
  if (!entry) return { type: 'rest', name: 'Nothing Happens', roll };

  return { ...entry, roll, dc: entry.dc || 10 + dangerLevel };
}

/**
 * Enemy stat blocks
 */
export const ENEMIES = {
  goblin: {
    name: 'Goblin Warrior',
    hp: 7,
    ac: 15,
    speed: 30,
    attacks: [{ name: 'Scimitar', toHit: 4, damage: '1d6+2' }],
    xp: 50,
    gold: '1d6+2',
    behavior: 'aggressive'
  },
  skeleton: {
    name: 'Skeleton Warrior',
    hp: 13,
    ac: 13,
    speed: 30,
    attacks: [{ name: 'Rusty Sword', toHit: 3, damage: '1d6+1' }],
    xp: 100,
    gold: '2d6',
    behavior: 'relentless'
  },
  wolf: {
    name: 'Gray Wolf',
    hp: 11,
    ac: 13,
    speed: 40,
    attacks: [{ name: 'Bite', toHit: 3, damage: '1d6+1' }],
    xp: 100,
    gold: '0',
    behavior: 'pack'
  },
  bandit: {
    name: 'Bandit',
    hp: 11,
    ac: 12,
    speed: 30,
    attacks: [{ name: 'Shortsword', toHit: 3, damage: '1d6+1' }],
    xp: 100,
    gold: '2d10+5',
    behavior: 'cautious'
  },
  bear: {
    name: 'Brown Bear',
    hp: 34,
    ac: 11,
    speed: 40,
    attacks: [{ name: 'Claws', toHit: 5, damage: '2d6+3' }],
    xp: 200,
    gold: '0',
    behavior: 'aggressive'
  },
  ogre: {
    name: 'Ogre',
    hp: 59,
    ac: 11,
    speed: 40,
    attacks: [{ name: 'Greatclub', toHit: 6, damage: '2d8+4' }],
    xp: 450,
    gold: '3d10+10',
    behavior: 'aggressive',
    isBoss: true
  }
};

/**
 * Start combat
 */
export function startCombat(enemyTypes, party) {
  const enemies = enemyTypes.map((type, i) => {
    const template = ENEMIES[type] || ENEMIES.goblin;
    return {
      id: `enemy_${type}_${i}`,
      ...template,
      hp: { current: template.hp, max: template.hp },
      type,
      conditions: [],
      position: { x: 3 + i, y: 0 }
    };
  });

  // Roll initiative for all combatants
  const combatants = [
    {
      id: 'player',
      name: party.name || 'Player',
      initiative: rollDice('1d20').total + party.initiative,
      isPlayer: true
    },
    ...enemies.map((e) => ({
      id: e.id,
      name: e.name,
      initiative: rollDice('1d20').total + Math.floor(Math.random() * 3),
      isPlayer: false
    }))
  ];

  combatants.sort((a, b) => b.initiative - a.initiative);

  return {
    initiative: combatants,
    currentTurn: 0,
    round: 1,
    activeCombatant: combatants[0].id,
    enemies,
    terrain: {
      type: 'dungeon_corridor',
      features: [],
      hazards: []
    },
    log: [
      {
        round: 1,
        event: `Combat started! Initiative: ${combatants.map((c) => c.name).join(' → ')}`
      }
    ],
    rewards: null
  };
}

/**
 * Resolve a combat turn
 */
export function resolveCombatAction(combat, action, party) {
  const { enemies, log, round } = combat;
  const activeId = combat.initiative[combat.currentTurn]?.id;

  if (action.type === 'attack') {
    const target = enemies.find((e) => e.id === action.target);
    if (!target) return { combat, error: 'Invalid target' };

    const attack = party.attacks?.[0] || { name: 'Unarmed Strike', damage: '1d4', toHit: 2 };
    const toHit = rollDice('1d20').total + (attack.toHit || 2);
    const hit = toHit >= target.ac;
    const isCrit = toHit - (attack.toHit || 2) === 20;

    let damage = 0;
    if (hit) {
      const dmgResult = rollDamage(attack.damage);
      damage = dmgResult.total;
      target.hp.current = Math.max(0, target.hp.current - damage);
    }

    log.push({
      round,
      actor: activeId,
      action: `${hit ? 'Hits' : 'Misses'} ${target.name} with ${attack.name}`,
      roll: toHit,
      ac: target.ac,
      hit,
      isCrit,
      damage
    });

    // Check if enemy is dead
    if (target.hp.current <= 0) {
      log.push({ round, event: `${target.name} is defeated!` });
      combat.enemies = enemies.filter((e) => e.hp.current > 0);
    }
  }

  return { combat, damage: action.type === 'attack' ? (log[log.length - 1]?.damage || 0) : 0 };
}
