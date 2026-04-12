# DnD Game Master System — Complete Design

> Created: 2026-04-10
> Focus: Mira the Game Master — full RPG system

---

## 1. Core Architecture

### 1.1 State Machine
```
Idle → Narrative → Skill Check → Combat → Rest → Travel → Shop → Event
  ↓        ↓          ↓           ↓        ↓       ↓        ↓       ↓
 Roll    Player     Dice Roll   Enemy     Camp   Browse   Random   NPC
Story   Action      Result     Turn      Fire   Items    Event    Dialog
  ↓        ↓          ↓           ↓        ↓       ↓        ↓       ↓
Narrative → Skill Check → Combat → Rest → Travel → Shop → Event → Idle
                    (loops until combat ends)
```

### 1.2 Campaign State Structure
```javascript
{
  // Meta
  campaignId: "campaign_001",
  title: "The Whispering Depths",
  act: 1,           // 1-3
  session: 1,       // Current session number
  totalSessions: 0,

  // World
  world: {
    name: "Eldoria",
    locations: [
      { id: "village", name: "Oakhaven", visited: true, explored: 0.3 },
      { id: "forest", name: "Darkwood", visited: true, explored: 0.7 },
      { id: "dungeon", name: "The Whispering Depths", visited: true, explored: 0.1 },
      { id: "mountain", name: "Frostpeak", visited: false, explored: 0 }
    ],
    currentLocation: "dungeon",
    timeOfDay: "night",  // dawn, morning, noon, afternoon, dusk, night
    weather: "clear",     // clear, rain, storm, snow, fog
    dangerLevel: 3,       // 1-5, scales with player level
    dayCount: 1
  },

  // Story
  story: {
    mainQuest: "Investigate the whispers from the ancient mine",
    sideQuests: [
      { id: "q1", title: "Find the missing villagers", status: "active", progress: 0.3 },
      { id: "q2", title: "Retrieve the lost amulet", status: "pending", progress: 0 }
    ],
    completedQuests: [],
    storyFlags: {          // Boolean flags for story progression
      metElder: true,
      foundMap: true,
      defeatedGoblins: false,
      discoveredSecretRoom: false,
      unlockedDungeonLevel2: false
    },
    narrativeLog: [        // Log of major story events
      { turn: 1, event: "Arrived at Oakhaven village" },
      { turn: 5, event: "Met Elder Thornwood, learned about the whispers" },
      { turn: 12, event: "Entered the Whispering Depths" }
    ]
  },

  // Party
  party: {
    player: { /* character sheet */ },
    companions: [],  // Future: NPCs that join
    maxPartySize: 4
  },

  // Combat (active only during combat)
  combat: null,  // See combat structure below

  // Inventory
  inventory: {
    gold: 25,
    items: [
      { id: "sword_iron", name: "Iron Sword", type: "weapon", damage: "1d6", equipped: true },
      { id: "potion_health", name: "Health Potion", type: "consumable", uses: 1, effect: "heal 2d6" },
      { id: "torch", name: "Torch", type: "tool", uses: 3 },
      { id: "map", name: "Torn Map", type: "quest" }
    ],
    maxSlots: 20
  },

  // Stats
  stats: {
    xp: 150,
    xpToNext: 300,
    level: 1,
    totalKills: 3,
    totalGoldEarned: 50,
    totalDamageDealt: 45,
    totalDamageTaken: 12,
    perfectFights: 0,
    criticalHits: 2,
    fumbles: 1
  }
}
```

### 1.3 Character Sheet
```javascript
{
  // Identity
  name: "Thorin Ironforge",
  class: "Fighter",        // Fighter, Rogue, Wizard, Cleric, Ranger
  race: "Dwarf",           // Human, Elf, Dwarf, Halfling, Gnome
  level: 1,
  background: "Soldier",

  // Core Stats
  stats: {
    strength: 16,      // modifier: +3
    dexterity: 12,     // modifier: +1
    constitution: 14,  // modifier: +2
    intelligence: 10,  // modifier: +0
    wisdom: 12,        // modifier: +1
    charisma: 8        // modifier: -1
  },

  // Derived
  hp: { current: 14, max: 14, temp: 0 },
  ac: 16,              // Armor Class
  speed: 25,           // feet
  initiative: 1,       // dex modifier

  // Combat
  attacks: [
    { name: "Longsword", type: "melee", damage: "1d8+3", proficiency: true },
    { name: "Handaxe", type: "ranged", damage: "1d6+3", range: 20, proficiency: true }
  ],
  savingThrows: ["strength", "constitution"],
  skills: [
    { name: "Athletics", stat: "strength", proficiency: true },
    { name: "Perception", stat: "wisdom", proficiency: true },
    { name: "Intimidation", stat: "charisma", proficiency: true }
  ],

  // Resources
  hitDice: "1d10",
  hitDiceRemaining: 1,
  spellSlots: {},      // For casters

  // Conditions
  conditions: [],      // poisoned, blinded, restrained, etc.

  // Proficiencies
  languages: ["Common", "Dwarvish"],
  armorProficiencies: ["Light", "Medium", "Heavy", "Shield"],
  weaponProficiencies: ["Simple", "Martial"]
}
```

### 1.4 Combat State
```javascript
{
  // Meta
  initiative: [],      // Ordered list of combatants
  currentTurn: 0,      // Index in initiative
  round: 1,
  activeCombatant: null,

  // Combatants
  enemies: [
    {
      id: "goblin_1",
      name: "Goblin Warrior",
      type: "goblin",
      hp: { current: 7, max: 7 },
      ac: 15,
      speed: 30,
      attacks: [
        { name: "Scimitar", damage: "1d6+2", toHit: 4 }
      ],
      skills: { perception: 8, stealth: 10 },
      // AI behavior
      behavior: "aggressive",  // aggressive, cautious, fleeing
      target: "player",
      // Status
      conditions: [],
      position: { x: 3, y: 2 }
    }
  ],

  // Environment
  terrain: {
    type: "dungeon_corridor",
    features: ["narrow_passage", "loose_rocks", "darkness"],
    cover: ["half_cover", "three_quarters_cover"],
    hazards: []
  },

  // Combat Log
  log: [
    { round: 1, turn: "player", action: "Attacks goblin_1", roll: 15, result: "hit", damage: 8 },
    { round: 1, turn: "goblin_1", action: "Attacks player", roll: 12, result: "miss" }
  ],

  // Rewards (calculated on victory)
  rewards: null,
  // After combat: { xp: 50, gold: 12, items: ["goblin_ear_trophy"], storyFlags: {} }
}
```

---

## 2. Tool Types for DnD

### 2.1 In-Chat Tools (Interactive Cards)

| Tool | When Used | Description |
|------|-----------|-------------|
| `dnd_narrative` | Every scene | Story text with choices |
| `dnd_dialog` | NPC encounters | Dialog tree with options |
| `dnd_skill_check` | Skill challenges | Dice roll + DC + result |
| `dnd_combat` | Combat start | Full combat UI |
| `dnd_combat_turn` | Each player turn | Action selection UI |
| `dnd_loot` | After combat/looting | Loot distribution UI |
| `dnd_rest` | Short/long rest | Recovery UI |
| `dnd_shop` | In town | Buy/sell interface |
| `dnd_map` | Exploration | Location choices |
| `dnd_levelup` | Level gained | Stat point allocation |
| `dnd_quest_update` | Quest progress | Quest status display |
| `dnd_death` | Player reaches 0 HP | Death/save UI |

### 2.2 Right Panel Widgets (Persistent)

| Widget | When Visible | Content |
|--------|-------------|---------|
| `character_sheet` | Always | HP, AC, stats, conditions |
| `inventory` | Always | Gold, items, equipped |
| `quest_log` | Always | Active/pending quests |
| `party_status` | Party > 1 | Companion HP/status |
| `campaign_map` | Exploration | Current location, options |
| `combat_tracker` | In combat | Initiative order, HP bars |
| `story_log` | Always | Scrollable narrative history |

---

## 3. Game Mechanics

### 3.1 Skill Check Flow
```
LLM decides skill check needed
    → Returns {"tool": "dnd_skill_check", "content": {...}}
    → UI shows: "Make a [Skill] check (DC [X])"
    → User clicks "Roll" or types custom roll
    → Dice rolls: 1d20 + modifier
    → Result:
        Nat 20: Critical success (extra effect)
        ≥ DC: Success
        < DC: Failure
        Nat 1: Critical failure (complication)
    → Result sent to LLM
    → LLM narrates outcome
    → Story flags updated
```

### 3.2 Combat Flow
```
Encounter triggered
    → INITIATIVE: Each combatant rolls 1d20 + dex mod
    → Sort by initiative
    → FOR EACH ROUND:
        FOR EACH combatant in initiative order:
            → If player's turn:
                Show action UI: Attack, Spell, Dash, Dodge, Disengage,
                                 Help, Hide, Ready, Use Item, Flee
                → Player selects action
                → If Attack: Roll to hit → If hit: Roll damage
                → If Spell: Select spell → Roll save or damage
                → If other: Resolve action
            → If enemy's turn:
                Enemy AI selects target and action
                → Roll to hit → If hit: Roll damage
                → Apply effects
            → Update HP, conditions, positions
            → Check for deaths
        → Check if all enemies dead → VICTORY
        → Check if all party dead → DEFEAT
    → VICTORY:
        Calculate XP, gold, loot
        Update story flags
        Return to exploration
    → DEFEAT:
        Death saving throws
        Capture/rescue options
        Game over or continuation
```

### 3.3 Enemy AI
```javascript
function enemyAI(enemy, combat, player) {
  const hpPercent = enemy.hp.current / enemy.hp.max;

  // Decision tree
  if (hpPercent < 0.25 && enemy.behavior !== "fanatical") {
    return { action: "flee", target: null };
  }

  if (hpPercent < 0.5 && enemy.behavior === "cautious") {
    return { action: "defend", target: null };
  }

  // Find target (usually lowest HP party member)
  const target = findWeakestTarget(combat.party);

  // Choose attack
  if (hasRangedAttack(enemy) && distance(enemy, target) > 5) {
    return { action: "ranged_attack", target, attack: enemy.rangedAttack };
  }

  if (canReach(enemy, target)) {
    return { action: "melee_attack", target, attack: enemy.bestMeleeAttack };
  }

  return { action: "move_toward", target };
}
```

### 3.4 Random Encounter System
```javascript
const ENCOUNTER_TABLES = {
  dungeon: [
    { roll: [1, 3], encounter: "goblin_patrol", dc: 10 },
    { roll: [4, 6], encounter: "trap", dc: 13 },
    { roll: [7, 9], encounter: "wandering_monster", dc: 12 },
    { roll: [10, 12], encounter: "treasure_cache", dc: 0 },
    { roll: [13, 15], encounter: "puzzle_room", dc: 14 },
    { roll: [16, 18], encounter: "npc_prisoner", dc: 0 },
    { roll: [19, 19], encounter: "mini_boss", dc: 15 },
    { roll: [20, 20], encounter: "nothing", dc: 0 }
  ],
  forest: [
    { roll: [1, 4], encounter: "wolf_pack", dc: 11 },
    { roll: [5, 8], encounter: "bandit_ambush", dc: 12 },
    { roll: [9, 12], encounter: "fairy_circle", dc: 0 },
    { roll: [13, 16], encounter: "lost_traveler", dc: 0 },
    { roll: [17, 19], encounter: "bear", dc: 14 },
    { roll: [20, 20], encounter: "ancient_ruins", dc: 0 }
  ]
};

function checkRandomEncounter(location, dangerLevel) {
  const roll = rollDice("1d20");
  const table = ENCOUNTER_TABLES[location] || ENCOUNTER_TABLES.dungeon;

  const entry = table.find(e => roll >= e.roll[0] && roll <= e.roll[1]);
  if (!entry || entry.encounter === "nothing") return null;

  return {
    type: entry.encounter,
    dc: entry.dc + dangerLevel - 3,  // Scale with danger
    roll,
    description: generateEncounterDescription(entry.encounter)
  };
}
```

### 3.5 Loot Generation
```javascript
const LOOT_TABLES = {
  goblin: {
    gold: "1d6+2",
    items: [
      { chance: 0.3, item: "rusty_dagger" },
      { chance: 0.2, item: "health_potion" },
      { chance: 0.1, item: "goblin_ear_trophy" },
      { chance: 0.05, item: "magic_ring" }
    ]
  },
  bandit: {
    gold: "2d10+5",
    items: [
      { chance: 0.4, item: "stolen_goods" },
      { chance: 0.3, item: "lockpick_set" },
      { chance: 0.15, item: "map_fragment" },
      { chance: 0.05, item: "enchanted_cloak" }
    ]
  }
};

function generateLoot(enemyType) {
  const table = LOOT_TABLES[enemyType] || LOOT_TABLES.goblin;
  const gold = rollDice(table.gold);
  const items = [];

  for (const entry of table.items) {
    if (Math.random() < entry.chance) {
      items.push(entry.item);
    }
  }

  return { gold, items };
}
```

---

## 4. Mira's System Prompt (DnD Master)

```
You are Mira, an expert Dungeon Master running a DnD 5e-style adventure.
You maintain persistent campaign state and make all game mechanics decisions.

## CORE RULES
- Use DnD 5e rules for combat, skills, and spells
- DC scales: Easy (10), Medium (13), Hard (16), Very Hard (20)
- Advantage/disadvantage on rolls when appropriate
- Death saving throws at 0 HP (3 successes = stable, 3 failures = dead)
- Short rest recovers hit dice and some abilities
- Long rest recovers all HP and spell slots

## NARRATIVE STYLE
- Describe scenes vividly (sights, sounds, smells, feelings)
- Give players meaningful choices with real consequences
- NPCs have personalities, motivations, and secrets
- The world reacts to player actions
- Balance combat, exploration, and social interaction

## COMBAT RULES
- Initiative: 1d20 + dex modifier
- Actions per turn: 1 action, 1 bonus action, movement
- Attack: 1d20 + proficiency + stat mod vs target AC
- Damage: weapon dice + stat mod
- Saving throws: 1d20 + stat mod vs DC
- Critical hit on nat 20 (double damage dice)
- Critical fail on nat 1 (automatic miss + complication)

## WHEN TO USE TOOLS
- Use dnd_narrative for scene descriptions with choices
- Use dnd_dialog for NPC interactions
- Use dnd_skill_check for skill challenges
- Use dnd_combat when combat starts
- Use dnd_combat_turn for each player combat turn
- Use dnd_loot after combat victory
- Use dnd_rest when players want to rest
- Use dnd_quest_update when quest progress is made
- Use dnd_levelup when player levels up

## IMPORTANT
- Always track HP, XP, gold, and inventory
- Random encounters scale with player level and danger level
- Reward creative solutions with advantage or lower DCs
- Never railroad — let players find their own path
- Death is possible but not pointless — offer consequences
- Track story flags and quest progress meticulously

## CAMPAIGN STATE
You will receive the current campaign state at the start of each message.
Update it with your response and return it in the tool data.
```

---

## 5. Implementation Priority

### Phase 1: Core DnD Framework
1. [ ] Campaign state management (create, save, load)
2. [ ] Character sheet generation (random stats, class selection)
3. [ ] Basic narrative tool (dnd_narrative with choices)
4. [ ] Skill check tool (dice roll, DC, success/failure)
5. [ ] Right panel: character sheet widget
6. [ ] Right panel: inventory widget
7. [ ] Right panel: quest log widget
8. [ ] Right panel: story log widget

### Phase 2: Combat System
1. [ ] Combat initiation and initiative rolling
2. [ ] dnd_combat_turn UI (action selection)
3. [ ] Attack/damage calculation
4. [ ] Enemy AI with behavior trees
5. [ ] HP tracking with visual bars
6. [ ] Death saving throws
7. [ ] Combat rewards (XP, gold, loot)
8. [ ] Right panel: combat tracker widget

### Phase 3: World & Exploration
1. [ ] Random encounter system with scaled tables
2. [ ] Location system with exploration progress
3. [ ] Day/night cycle and weather effects
4. [ ] Travel time and resource management
5. [ ] Shop system (dnd_shop tool)
6. [ ] Rest system (short/long rest recovery)
7. [ ] Map widget with fog of war

### Phase 4: Advanced Features
1. [ ] Level up system with stat allocation
2. [ ] Spell system for casters
3. [ ] Companion NPCs that can join party
4. [ ] Quest system with branching paths
5. [ ] Reputation/faction system
6. [ ] Multiple campaign support
7. [ ] Campaign export/import

### Phase 5: Polish
1. [ ] Sound effects for dice rolls, combat hits
2. [ ] Animated HP bars, damage numbers
3. [ ] Visual combat log
4. [ ] Achievement system for DnD milestones
5. [ ] Campaign statistics dashboard
6. [ ] Save/load campaign from SQLite
7. [ ] Undo last action (regret button)
