// ═══════════════════════════════════════════
// DnD Campaign State Management
// ═══════════════════════════════════════════

// Character Classes
export const CLASSES = {
  fighter: {
    name: 'Fighter',
    hitDice: '1d10',
    primaryStat: 'strength',
    savingThrows: ['strength', 'constitution'],
    baseAc: 16,
    baseHp: 14
  },
  rogue: {
    name: 'Rogue',
    hitDice: '1d8',
    primaryStat: 'dexterity',
    savingThrows: ['dexterity', 'intelligence'],
    baseAc: 14,
    baseHp: 10
  },
  wizard: {
    name: 'Wizard',
    hitDice: '1d6',
    primaryStat: 'intelligence',
    savingThrows: ['intelligence', 'wisdom'],
    baseAc: 12,
    baseHp: 8
  },
  cleric: {
    name: 'Cleric',
    hitDice: '1d8',
    primaryStat: 'wisdom',
    savingThrows: ['wisdom', 'charisma'],
    baseAc: 16,
    baseHp: 10
  },
  ranger: {
    name: 'Ranger',
    hitDice: '1d10',
    primaryStat: 'dexterity',
    savingThrows: ['strength', 'dexterity'],
    baseAc: 15,
    baseHp: 12
  }
};

export const RACES = {
  human: { name: 'Human', statBonus: { all: 1 }, speed: 30 },
  elf: { name: 'Elf', statBonus: { dexterity: 2 }, speed: 35, darkvision: true },
  dwarf: { name: 'Dwarf', statBonus: { constitution: 2 }, speed: 25, darkvision: true },
  halfling: { name: 'Halfling', statBonus: { dexterity: 2 }, speed: 25, lucky: true },
  gnome: { name: 'Gnome', statBonus: { intelligence: 2 }, speed: 25, darkvision: true }
};

// Generate random stats (4d6 drop lowest)
export function rollStats() {
  const stats = {};
  const names = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  for (const name of names) {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    stats[name] = rolls[1] + rolls[2] + rolls[3];
  }

  return stats;
}

// Calculate modifier from stat value
export function getModifier(statValue) {
  return Math.floor((statValue - 10) / 2);
}

// Generate a character
export function createCharacter(name, className, raceName) {
  const cls = CLASSES[className];
  const race = RACES[raceName];
  const baseStats = rollStats();

  // Apply racial bonuses
  const stats = { ...baseStats };
  if (race.statBonus.all) {
    for (const key of Object.keys(stats)) {
      stats[key] += race.statBonus.all;
    }
  } else {
    for (const [key, bonus] of Object.entries(race.statBonus)) {
      stats[key] += bonus;
    }
  }

  const conMod = getModifier(stats.constitution);
  const dexMod = getModifier(stats.dexterity);

  return {
    name: name || 'Adventurer',
    class: className,
    className: cls.name,
    race: raceName,
    raceName: race.name,
    level: 1,
    stats,
    hp: { current: cls.baseHp + conMod, max: cls.baseHp + conMod, temp: 0 },
    ac: cls.baseAc + dexMod,
    speed: race.speed,
    initiative: dexMod,
    hitDice: cls.hitDice,
    hitDiceRemaining: 1,
    savingThrows: cls.savingThrows,
    conditions: [],
    inventory: [
      { id: 'weapon', name: cls.name === 'Fighter' ? 'Longsword' : 'Dagger', type: 'weapon', damage: cls.name === 'Fighter' ? '1d8' : '1d4' },
      { id: 'potion', name: 'Health Potion', type: 'consumable', uses: 1, effect: 'heal 2d6' },
      { id: 'torch', name: 'Torch', type: 'tool', uses: 3 },
      { id: 'backpack', name: 'Adventurer\'s Pack', type: 'tool', uses: -1 }
    ],
    gold: Math.floor(Math.random() * 20) + 10,
    xp: 0,
    xpToNext: 300,
    inspiration: 3 // Starting inspiration tokens — earned for great roleplay, spent for luck
  };
}

// Create initial campaign state
export function createCampaign(characterName = 'Adventurer', className = 'fighter', raceName = 'human') {
  const character = createCharacter(characterName, className, raceName);

  return {
    campaignId: `campaign_${Date.now()}`,
    title: 'The Whispering Depths',
    act: 1,
    session: 1,
    totalSessions: 0,
    world: {
      name: 'Eldoria',
      locations: [
        { id: 'village', name: 'Oakhaven', visited: true, explored: 0.3, description: 'A peaceful village at the edge of the Darkwood' },
        { id: 'forest', name: 'Darkwood', visited: true, explored: 0.2, description: 'A dense, ancient forest filled with mystery' },
        { id: 'dungeon', name: 'The Whispering Depths', visited: true, explored: 0.05, description: 'An ancient mine where strange whispers echo' },
        { id: 'mountain', name: 'Frostpeak', visited: false, explored: 0, description: 'A treacherous mountain pass to the north' }
      ],
      currentLocation: 'dungeon',
      timeOfDay: 'dusk',
      weather: 'clear',
      dangerLevel: 2,
      dayCount: 1
    },
    story: {
      mainQuest: 'Investigate the whispers from the ancient mine',
      sideQuests: [
        { id: 'q1', title: 'Find the missing villagers', status: 'active', progress: 0, description: 'Three villagers disappeared near the mine entrance' },
        { id: 'q2', title: 'Retrieve the lost amulet', status: 'pending', progress: 0, description: 'The elder\'s amulet was stolen by goblins' }
      ],
      completedQuests: [],
      storyFlags: {
        metElder: true,
        foundMap: true,
        defeatedGoblins: false,
        discoveredSecretRoom: false,
        unlockedDungeonLevel2: false
      },
      narrativeLog: [
        { turn: 1, event: 'Arrived at Oakhaven village' },
        { turn: 2, event: 'Met Elder Thornwood, learned about the whispers' },
        { turn: 3, event: 'Entered the Whispering Depths' }
      ]
    },
    character,
    inventory: {
      gold: character.gold,
      items: character.inventory,
      maxSlots: 20
    },
    stats: {
      xp: 0,
      xpToNext: 300,
      level: 1,
      totalKills: 0,
      totalGoldEarned: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      perfectFights: 0,
      criticalHits: 0,
      fumbles: 0
    },
    combat: null,
    turnCount: 0
  };
}
