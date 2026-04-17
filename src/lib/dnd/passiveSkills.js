// ═══════════════════════════════════════════
// Passive Skills System
// ═══════════════════════════════════════════

/**
 * Passive skills that grant automatic dice rolls or bonuses
 * Granted by race, items, story events, or companion gifts
 */
export const PASSIVE_SKILLS = {
  // Race-based passives
  darkvision: {
    id: 'darkvision',
    name: 'Darkvision',
    description: 'You can see in darkness up to 60 feet',
    source: 'race',
    trigger: 'dark_environment',
    effect: { type: 'info_reveal', stat: 'dark_vision', value: 60 }
  },
  dwarven_resilience: {
    id: 'dwarven_resilience',
    name: 'Dwarven Resilience',
    description: 'Advantage on saving throws against poison',
    source: 'race',
    trigger: 'poison_save',
    effect: { type: 'advantage', stat: 'constitution', value: 1 }
  },
  elven_trance: {
    id: 'elven_trance',
    name: 'Elven Trance',
    description: 'You do not need to sleep and can remain conscious',
    source: 'race',
    trigger: 'night_watch',
    effect: { type: 'info_reveal', stat: 'awareness', value: 2 }
  },
  halfling_lucky: {
    id: 'halfling_lucky',
    name: 'Lucky',
    description: 'When you roll a 1 on a d20, you can reroll it',
    source: 'race',
    trigger: 'roll_1',
    effect: { type: 'reroll', stat: 'any', value: 1 }
  },
  gnome_cunning: {
    id: 'gnome_cunning',
    name: 'Gnome Cunning',
    description: 'Advantage on all Intelligence, Wisdom, and Charisma saving throws',
    source: 'race',
    trigger: 'mental_save',
    effect: { type: 'advantage', stats: ['intelligence', 'wisdom', 'charisma'], value: 1 }
  },

  // Combat passives
  tough: {
    id: 'tough',
    name: 'Tough',
    description: 'Your hit point maximum increases by 2 per level',
    source: 'feat',
    trigger: 'level_up',
    effect: { type: 'stat_boost', stat: 'max_hp', valuePerLevel: 2 }
  },
  alert: {
    id: 'alert',
    name: 'Alert',
    description: 'You gain +5 to initiative',
    source: 'feat',
    trigger: 'combat_start',
    effect: { type: 'stat_boost', stat: 'initiative', value: 5 }
  },
  lucky_feat: {
    id: 'lucky_feat',
    name: 'Lucky',
    description: 'You have 3 luck points to reroll any d20',
    source: 'feat',
    trigger: 'any_roll',
    effect: { type: 'luck_points', value: 3 }
  },

  // Item passives
  amulet_of_health: {
    id: 'amulet_of_health',
    name: 'Amulet of Health',
    description: 'Your Constitution score is 19',
    source: 'item',
    trigger: 'always',
    effect: { type: 'stat_override', stat: 'constitution', value: 19 }
  },
  boots_of_speed: {
    id: 'boots_of_speed',
    name: 'Boots of Speed',
    description: 'Your walking speed doubles',
    source: 'item',
    trigger: 'movement',
    effect: { type: 'stat_boost', stat: 'speed', multiplier: 2 }
  },
  cloak_of_protection: {
    id: 'cloak_of_protection',
    name: 'Cloak of Protection',
    description: 'You gain +1 to AC and saving throws',
    source: 'item',
    trigger: 'always',
    effect: { type: 'stat_boost', stats: ['ac', 'saves'], value: 1 }
  },

  // Enemy vulnerability detection
  enemy_vulnerabilities: {
    id: 'enemy_vulnerabilities',
    name: 'Enemy Vulnerabilities',
    description: 'You notice enemy weaknesses before combat',
    source: 'skill',
    trigger: 'pre_combat',
    effect: { type: 'info_reveal', stat: 'enemy_weakness', value: 1 }
  },
  trap_sense: {
    id: 'trap_sense',
    name: 'Trap Sense',
    description: 'You have an intuitive sense of traps',
    source: 'skill',
    trigger: 'trap_environment',
    effect: { type: 'info_reveal', stat: 'trap_dc', value: 1 }
  },
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'You notice hidden loot and secret doors',
    source: 'skill',
    trigger: 'explore_environment',
    effect: { type: 'info_reveal', stat: 'hidden_items', value: 1 }
  },
  enemys_master: {
    id: 'enemys_master',
    name: "Enemy's Master",
    description: 'You read enemy tactics and predict their moves',
    source: 'skill',
    trigger: 'combat_start',
    effect: { type: 'info_reveal', stat: 'enemy_tactics', value: 1 }
  },
  ancient_knowledge: {
    id: 'ancient_knowledge',
    name: 'Ancient Knowledge',
    description: 'You understand ancient runes and magical traps',
    source: 'skill',
    trigger: 'ancient_environment',
    effect: { type: 'info_reveal', stat: 'rune_meaning', value: 1 }
  }
};

/**
 * Generate random starting passives based on race
 */
export function generateStartingPassives(race) {
  const racePassives = {
    human: ['lucky_feat'],
    elf: ['darkvision', 'elven_trance'],
    dwarf: ['darkvision', 'dwarven_resilience'],
    halfling: ['halfling_lucky'],
    gnome: ['darkvision', 'gnome_cunning']
  };

  const basePassives = racePassives[race] || ['lucky_feat'];

  // Add 1-2 random skill passives
  const skillPassives = [
    'trap_sense',
    'treasure_hunter',
    'enemy_vulnerabilities',
    'enemys_master',
    'ancient_knowledge'
  ];
  const shuffled = [...skillPassives];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const randomCount = Math.floor(Math.random() * 2) + 1;

  return [...basePassives, ...shuffled.slice(0, randomCount)].map((id) => ({
    id,
    ...PASSIVE_SKILLS[id]
  }));
}

/**
 * Get active passives for a trigger
 */
export function getPassivesForTrigger(passiveList, trigger) {
  return passiveList.filter((p) => p.trigger === trigger || p.trigger === 'always');
}

/**
 * Auto-roll for passive skill
 */
export function autoRollPassive(passive, context = {}) {
  const effect = passive.effect;

  if (effect.type === 'info_reveal') {
    return {
      passive: passive.name,
      type: 'info',
      stat: effect.stat,
      value: effect.value,
      description: `${passive.name}: You notice something about ${effect.stat}...`
    };
  }

  if (effect.type === 'advantage') {
    return {
      passive: passive.name,
      type: 'advantage',
      stats: effect.stats || [effect.stat],
      description: `${passive.name}: You have advantage on ${effect.stats?.join(', ') || effect.stat} saves`
    };
  }

  if (effect.type === 'stat_boost') {
    const value = effect.multiplier ? context[effect.stat] * effect.multiplier : effect.value;
    return {
      passive: passive.name,
      type: 'boost',
      stat: effect.stat,
      value,
      description: `${passive.name}: +${value} to ${effect.stat}`
    };
  }

  if (effect.type === 'reroll') {
    return {
      passive: passive.name,
      type: 'reroll',
      stat: effect.stat,
      description: `${passive.name}: You can reroll a 1`
    };
  }

  if (effect.type === 'luck_points') {
    return {
      passive: passive.name,
      type: 'luck',
      value: effect.value,
      description: `${passive.name}: You have ${effect.value} luck points`
    };
  }

  return null;
}
