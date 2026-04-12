// ═══════════════════════════════════════════
// DnD LLM Response Schema
// ═══════════════════════════════════════════

/**
 * This is the JSON structure the DnD LLM (Mira) MUST return for every response.
 * It contains everything the UI needs to render the scene, choices, enemies,
 * environment, system events, and passive skill rolls.
 */

/**
 * Example DnD response structure:
 *
{
  "narrative": "The tunnel opens into a vast cavern...",
  "situation": "Three goblins guard a rusted gate",
  "environment": {
    "location": "The Whispering Mines, Level 2",
    "lighting": "dim",
    "features": ["rope_bridge", "rusted_gate", "oil_spill"],
    "hazards": ["unstable_ceiling"],
    "hidden": {
      "traps": [
        { "type": "tripwire", "dc": 14, "hint": "A faint wire catches the dim light" }
      ],
      "loot": [
        { "item": "Silver Ring", "dc": 16, "hint": "Something glints behind a loose stone" }
      ],
      "secret_doors": [
        { "description": "A hollow sound behind the eastern wall", "dc": 15 }
      ]
    }
  },
  "enemies": [
    {
      "id": "goblin_1",
      "name": "Goblin Warrior",
      "hp": 7,
      "maxHp": 7,
      "ac": 15,
      "visible": true,
      "vulnerabilities": ["fire"],
      "resistances": [],
      "behaviors": ["aggressive"],
      "known_abilities": ["Scimitar +4 (1d6+2)"]
    }
  ],
  "player": {
    "hp": 8,
    "maxHp": 12,
    "ac": 16,
    "modifiers": {
      "strength": 3,
      "dexterity": 1,
      "initiative": 2
    },
    "passiveRolls": [
      {
        "skill": "Trap Sense",
        "roll": 15,
        "result": "You sense a tripwire ahead"
      }
    ]
  },
  "choices": [
    {
      "id": "attack",
      "text": "Attack the goblins with your sword",
      "type": "combat",
      "dc": 12,
      "stat": "strength",
      "modifier": 3,
      "risk": "medium",
      "consequence": {
        "success": "You cleave through the first goblin",
        "failure": "Your swing goes wide. The goblins counterattack!",
        "partial": "You wound one goblin, but the others close in"
      }
    }
  ],
  "systemEvents": [
    {
      "tool": "dnd_loot",
      "title": "Loot Acquired",
      "message": "Found: 12 gold, Health Potion, 50 XP"
    }
  ],
  "campaign": {
    "act": 1,
    "episode": 2,
    "storyFlags": { "defeatedGoblins": true },
    "questUpdates": [
      { "id": "q1", "title": "Find the missing villagers", "progress": 0.3, "status": "active" }
    ]
  },
  "requiresDiceRoll": false,
  "diceNotation": null,
  "dc": null
}
 */

export const DND_RESPONSE_SCHEMA = {
  required: ['narrative', 'situation', 'choices'],
  properties: {
    narrative: { type: 'string', description: 'Story text, 2-4 sentences' },
    situation: { type: 'string', description: 'Current situation summary' },
    environment: {
      type: 'object',
      properties: {
        location: 'string',
        lighting: 'string (bright/dim/dark)',
        features: 'array of visible features',
        hazards: 'array of dangers',
        hidden: {
          traps: 'array of {type, dc, hint}',
          loot: 'array of {item, dc, hint}',
          secret_doors: 'array of {description, dc}'
        }
      }
    },
    enemies: {
      type: 'array',
      items: {
        id: 'string',
        name: 'string',
        hp: 'number',
        maxHp: 'number',
        ac: 'number',
        visible: 'boolean',
        vulnerabilities: 'array of strings',
        resistances: 'array of strings',
        behaviors: 'array of strings',
        known_abilities: 'array of strings'
      }
    },
    player: {
      type: 'object',
      properties: {
        hp: 'number',
        maxHp: 'number',
        ac: 'number',
        modifiers: 'object of stat → modifier',
        passiveRolls: 'array of {skill, roll, result}'
      }
    },
    choices: {
      type: 'array',
      items: {
        id: 'string',
        text: 'string',
        type: 'string (combat/exploration/social/puzzle/rest)',
        dc: 'number (optional)',
        stat: 'string (optional)',
        modifier: 'number (optional)',
        risk: 'string (low/medium/high)',
        consequence: {
          success: 'string',
          failure: 'string',
          partial: 'string'
        }
      },
      minItems: 3,
      maxItems: 4
    },
    systemEvents: {
      type: 'array',
      items: {
        tool: 'string (dnd_loot/dnd_rest/achievement/etc)',
        title: 'string',
        message: 'string'
      }
    },
    campaign: {
      type: 'object',
      properties: {
        act: 'number',
        episode: 'number',
        storyFlags: 'object of boolean flags',
        questUpdates: 'array of {id, title, progress, status}'
      }
    },
    requiresDiceRoll: { type: 'boolean' },
    diceNotation: { type: 'string (e.g. "1d20+3")' },
    dc: { type: 'number' }
  }
};

/**
 * Build the system prompt that instructs Mira to always return this JSON structure
 */
export function buildDnDSystemPrompt(assistantDescription) {
  return `${assistantDescription}

## RESPONSE FORMAT — ALWAYS USE THIS JSON STRUCTURE

Every response MUST be valid JSON with this exact structure:

\`\`\`json
{
  "narrative": "2-4 sentences describing the scene with sensory details",
  "situation": "Brief summary of what's happening right now",
  "environment": {
    "location": "Current location name",
    "lighting": "bright|dim|dark",
    "features": ["visible_objects", "landmarks"],
    "hazards": ["dangers", "environmental_threats"],
    "hidden": {
      "traps": [{"type": "tripwire", "dc": 14, "hint": "visible only on close inspection"}],
      "loot": [{"item": "Silver Ring", "dc": 16, "hint": "glints in the corner"}],
      "secret_doors": [{"description": "hollow wall", "dc": 15}]
    }
  },
  "enemies": [
    {
      "id": "enemy_unique_id",
      "name": "Goblin Warrior",
      "hp": 7,
      "maxHp": 7,
      "ac": 15,
      "visible": true,
      "vulnerabilities": ["fire"],
      "resistances": [],
      "behaviors": ["aggressive"],
      "known_abilities": ["Scimitar +4 (1d6+2)"]
    }
  ],
  "player": {
    "hp": 8,
    "maxHp": 12,
    "ac": 16,
    "modifiers": {"strength": 3, "dexterity": 1},
    "passiveRolls": [
      {"skill": "Trap Sense", "roll": 15, "result": "You sense danger ahead"}
    ]
  },
  "choices": [
    {
      "id": "unique_action_id",
      "text": "Attack the goblin with your sword",
      "type": "combat",
      "dc": 12,
      "stat": "strength",
      "modifier": 3,
      "risk": "medium",
      "consequence": {
        "success": "You strike true!",
        "failure": "You miss and stumble!",
        "partial": "You graze it but it retaliates"
      }
    }
  ],
  "systemEvents": [
    {"tool": "dnd_loot", "title": "Loot!", "message": "Found 12 gold, 50 XP"}
  ],
  "campaign": {
    "act": 1,
    "episode": 2,
    "storyFlags": {"goblinsDefeated": true},
    "questUpdates": [{"id": "q1", "progress": 0.3}]
  },
  "requiresDiceRoll": false,
  "diceNotation": "1d20+3",
  "dc": 12
}
\`\`\`

## RULES:
- narrative and situation are ALWAYS required
- choices must have 3-4 options (A-D)
- Each choice MUST have id, text, type, and consequence object
- Include enemy HP/AC/vulnerabilities when enemies are present
- Include hidden traps/loot with DCs for discovery
- passiveRolls are automatic — triggered by player skills (Trap Sense, Treasure Hunter, etc.)
- systemEvents are for loot, achievements, rest notifications
- requiresDiceRoll = true when the NEXT player action needs a dice roll
- NEVER break character — you ARE the Dungeon Master

## DICE & OUTCOMES:
- When player chooses an action, check their modifier vs DC
- Natural 20 = critical success, Natural 1 = critical failure
- Factor in passive skill rolls for additional info
- Update enemy HP, player HP, and story state accordingly
- ALWAYS narrate the outcome based on the dice result`;
}
