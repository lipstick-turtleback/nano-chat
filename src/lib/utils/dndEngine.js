// ═══════════════════════════════════════════
// DnD RPG Engine — Universal game system
// Companions invoke via JSON, stats persisted in localStorage
// ═══════════════════════════════════════════

export const DND_CLASSES = {
  warrior: {
    name: 'Warrior',
    emoji: '⚔️',
    primaryStat: 'strength',
    hpBase: 12,
    startingSkills: ['attack', 'shield_bash']
  },
  mage: {
    name: 'Mage',
    emoji: '🔮',
    primaryStat: 'intelligence',
    hpBase: 8,
    startingSkills: ['magic_missile', 'heal']
  },
  rogue: {
    name: 'Rogue',
    emoji: '🗡️',
    primaryStat: 'dexterity',
    hpBase: 10,
    startingSkills: ['sneak_attack', 'lockpick']
  },
  bard: {
    name: 'Bard',
    emoji: '🎵',
    primaryStat: 'charisma',
    hpBase: 9,
    startingSkills: ['inspire', 'charm']
  }
};

export const DND_STATS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
];

/**
 * Generate DnD character with rolled stats
 */
export function createDnDCharacter(name, charClass) {
  const classData = DND_CLASSES[charClass];
  if (!classData) return null;

  const stats = {};
  for (const stat of DND_STATS) {
    // Roll 4d6, drop lowest
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    stats[stat] = rolls[1] + rolls[2] + rolls[3];
  }

  // Boost primary stat
  stats[classData.primaryStat] += 2;

  return {
    name,
    class: charClass,
    className: classData.name,
    emoji: classData.emoji,
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: classData.hpBase + Math.floor((stats.constitution - 10) / 2),
    maxHp: classData.hpBase + Math.floor((stats.constitution - 10) / 2),
    stats,
    skills: [...classData.startingSkills],
    inventory: ['health_potion'],
    gold: 10,
    location: 'starting_village',
    storyProgress: 0,
    choices: [],
    createdAt: new Date().toISOString()
  };
}

/**
 * Generate a story chapter prompt for the LLM
 * The LLM responds with a JSON scene
 */
export function createDnDPrompt(character, sceneContext) {
  return `You are the Dungeon Master for a text-based DnD adventure.

CHARACTER:
- Name: ${character.name}
- Class: ${character.className} ${character.emoji}
- Level: ${character.level}
- HP: ${character.hp}/${character.maxHp}
- Stats: STR ${character.stats.strength}, DEX ${character.stats.dexterity}, CON ${character.stats.constitution}, INT ${character.stats.intelligence}, WIS ${character.stats.wisdom}, CHA ${character.stats.charisma}
- Location: ${character.location}
- Story Progress: ${character.storyProgress}

${sceneContext ? `SCENE CONTEXT: ${sceneContext}\n` : ''}

Generate the next scene as JSON ONLY (no other text):

{
  "scene": {
    "title": "A dramatic scene title",
    "narrative": "2-4 sentences of immersive story describing the scene, NPCs, and what the character sees/senses. Write in second person: 'You see...', 'You hear...'",
    "choices": [
      {
        "text": "What the player can do",
        "type": "combat" | "skill_check" | "dialogue" | "exploration" | "puzzle",
        "stat": "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma",
        "dc": 12,
        "successXp": 25,
        "failXp": 10,
        "skillNeeded": "optional skill name"
      }
    ],
    "hiddenInfo": "What the DM knows but the player doesn't yet (trap hints, NPC secrets, etc.)"
  }
}

Rules:
- DC should scale with character level (DC = 10 + level * 2)
- Include 3-4 meaningful choices
- At least one choice should use their primary stat
- Make it engaging and relevant to their character and location
- If they have low HP, include a healing opportunity
- After 3+ scenes, introduce a mini-boss or major plot twist`;
}

/**
 * Process player's choice and generate resolution prompt for LLM
 */
export function createDnDResolutionPrompt(character, scene, choiceIndex, playerAction) {
  const choice = scene.choices[choiceIndex];
  if (!choice) return null;

  return `DnD Resolution — resolve the player's action.

CHARACTER: ${character.name} the ${character.className} (Level ${character.level})
CHOICE: "${choice.text}"
PLAYER ACTION: "${playerAction}"
STAT CHECK: ${choice.stat || 'none'} vs DC ${choice.dc || 10}
PLAYER'S ${choice.stat?.toUpperCase() || 'N/A'}: ${choice.stat ? character.stats[choice.stat] : 'N/A'}

Did the player succeed? Calculate based on:
- Roll a d20: ${Math.floor(Math.random() * 20) + 1}
- Add stat modifier: ${choice.stat ? Math.floor((character.stats[choice.stat] - 10) / 2) : 0}
- Total vs DC ${choice.dc || 10}

Respond with JSON ONLY:

{
  "resolution": {
    "roll": 15,
    "modifier": 2,
    "total": 17,
    "dc": 14,
    "success": true,
    "narrative": "2-3 sentences describing what happens. Second person. Dramatic and immersive.",
    "damageTaken": 0,
    "xpGained": 25,
    "loot": [],
    "newLocation": "optional new location",
    "storyProgressIncrement": 1,
    "nextSceneHook": "Brief hint about what comes next"
  }
}`;
}

/**
 * Level up character
 */
export function levelUpCharacter(character) {
  const newLevel = character.level + 1;
  const classData = DND_CLASSES[character.class];

  return {
    ...character,
    level: newLevel,
    xp: character.xp - character.xpToNext,
    xpToNext: Math.floor(character.xpToNext * 1.5),
    maxHp:
      character.maxHp +
      Math.floor(classData.hpBase / 2) +
      Math.floor((character.stats.constitution - 10) / 2),
    hp: character.maxHp, // Full heal on level up
    storyProgress: character.storyProgress + 1
  };
}
