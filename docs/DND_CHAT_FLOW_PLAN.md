# DnD Chat Flow — Complete Implementation Plan

> Created: 2026-04-13
> Status: Ready for implementation

## Architecture

### Core Principle
**Every LLM response is pure JSON. The client renders JSON into UI. Dice rolls happen on the client instantly. The dice animation shows the known result while the LLM (already knowing the roll) prepares the narrative JSON.**

### JSON-First Design
The LLM responds with a **single JSON object** containing:
- `narrative` — Story text describing what happened
- `enemies` — Current enemies with updated HP/AC/status
- `environment` — Location, lighting, features, danger level
- `systemEvents` — Array of state changes (XP, loot, damage, inspiration)
- `actions` — 4-8 possible next actions, each with:
  - `label` — Button text
  - `stat` — Character stat to check (STR, DEX, CON, INT, WIS, CHA)
  - `dice` — Dice size (1d20, 1d6, 1d8, 1d12, 2d6, 1d10, 1d4)
  - `dc` — Difficulty class
  - `type` — combat, exploration, social, rest
- `customActionHint` — Hint text for custom action input

The client parses this JSON and renders:
- Narrative text as a story message
- Next scene card with action buttons (showing stat + dice for each)
- Tool notifications for system events

---

## Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: LLM presents a DnD scene (JSON response)               │
│                                                                 │
│ The client renders this as a DnDSceneCard with:                 │
│ - Narrative text at top                                         │
│ - 4-8 action buttons, each showing: label + stat + dice + DC   │
│ - Custom action textarea                                        │
│ - "Spend Inspiration" toggle (if inspiration > 0)              │
│                                                                 │
│ Example action buttons:                                         │
│   [A] Attack the goblin      STR  1d20  DC 13                  │
│   [B] Sneak past             DEX  1d20  DC 14                  │
│   [C] Intimidate             CHA  1d8   DC 12                  │
│   [D] Search the body       WIS  1d6   DC 8                   │
│   [E] Set a trap            DEX  1d8   DC 13                  │
│   [F] Rest & recover        —    —     —                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User clicks an action or types custom + Submit
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CLIENT rolls dice instantly (< 1ms)                     │
│                                                                 │
│ - Read chosen action: { stat, dice, dc }                       │
│ - Roll the specified dice: e.g., rollDice("1d20") → 17         │
│ - Check inspiration spend → advantage if yes (roll 2x, take hi)│
│ - Check passive skills → bonuses if triggered                  │
│ - Calculate total = naturalRoll + modifier + passives          │
│ - Determine crit (nat 20) / fumble (nat 1)                     │
│                                                                 │
│ Store: { naturalRoll, advantageRoll?, modifier, total, dc,     │
│          dice: "1d20", isCrit, isFumble, passives[], inspSpent }│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CLIENT sends prompt to LLM (streaming starts)          │
│                                                                 │
│ The prompt includes:                                            │
│ - Action: "Attack the goblin"                                   │
│ - Dice: natural=17, total=20 vs DC=13 → SUCCESS                │
│ - Character sheet, HP, enemies, location, quests               │
│ - Instructions: "Narrate outcome, return JSON with next scene"  │
│                                                                 │
│ The LLM already knows the roll result and can weave it into    │
│ the narrative appropriately.                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: USER SEES dice animation (2 seconds)                   │
│                                                                 │
│ ┌───────────────────────────────────────────────┐               │
│ │ 🎲 Rolling...                                 │               │
│ │                                               │               │
│ │    [ 3 → 17 → 9 → 14 → 20 → 6 → 17... ]     │               │
│ │                                               │               │
│ │    ┌───┐                                      │               │
│ │    │ 17│  + 3 = 20                           │               │
│ │    └───┘                                      │               │
│ │    SUCCESS (vs DC 13)                         │               │
│ │    ✨ Inspiration spent!                      │               │
│ └───────────────────────────────────────────────┘               │
│                                                                 │
│ Meanwhile, LLM is already streaming its JSON response...       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ After 2 seconds
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Dice message removed, LLM narrative streams in         │
│                                                                 │
│ Mira 🎲:                                                        │
│                                                                 │
│ "You raise your sword and charge! The goblin's yellow eyes     │
│ widen as your blade arcs through the damp air..."              │
│                                                                 │
│ ┌───────────────────────────────────────┐                       │
│ │ ⚔️ +50 XP — Defeated Goblin Warrior   │ ← ToolNotification   │
│ │ 💰 +8 gold, Rusty Scimitar            │                       │
│ │ ✨ +1 Inspiration — Bold charge       │                       │
│ └───────────────────────────────────────┘                       │
│                                                                 │
│ ┌───────────────────────────────────────────────────────┐       │
│ │ 🎲 The Three Paths                                    │       │
│ │                                                       │       │
│ │ "A faint glow emanates from the left tunnel..."       │       │
│ │                                                       │       │
│ │ [A] Follow the glow       WIS  1d20  DC 12            │       │
│ │ [B] Investigate dripping  INT  1d20  DC 10            │       │
│ │ [C] Search the body      WIS  1d6   DC 8             │       │
│ │ [D] Rest & recover        —    —     —                │       │
│ │ [E] Shout a challenge    CHA  1d8   DC 14             │       │
│ │ [F] Set a trap           DEX  1d8   DC 13             │       │
│ │                                                       │       │
│ │ Or describe your own action: [___________] [Submit]  │       │
│ └───────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Loop back to Step 2
```

---

## LLM Response JSON Schema (EVERY response)

```json
{
  "narrative": "You raise your sword and charge! The goblin's yellow eyes widen as your blade arcs through the damp air. Its scimitar shatters on impact, and the creature crumples with a startled yelp.",
  "enemies": [
    {
      "id": "goblin_warrior",
      "name": "Goblin Warrior",
      "hp": { "current": 0, "max": 7 },
      "ac": 15,
      "status": "defeated",
      "description": "A small green creature in leather armor, now motionless."
    }
  ],
  "environment": {
    "location": "The Whispering Depths, Past the Iron Gate",
    "lighting": "dim",
    "features": ["glowing mushrooms on the walls", "dripping water echoes ahead", "a rusted iron gate behind you"],
    "lightingMod": "The mushrooms cast an eerie green glow that reveals three tunnel entrances ahead.",
    "weather": null,
    "timeOfDay": "night",
    "dangerLevel": 3
  },
  "systemEvents": [
    { "tool": "dnd_xp", "amount": 50, "reason": "Defeated Goblin Warrior" },
    { "tool": "dnd_loot", "gold": 8, "items": ["Rusty Scimitar"], "xp": 0 },
    { "tool": "dnd_inspiration", "amount": 1, "reason": "Bold charge tactic" }
  ],
  "actions": [
    {
      "id": "follow_glow",
      "label": "Follow the faint green glow",
      "stat": "WIS",
      "dice": "1d20",
      "dc": 12,
      "type": "exploration",
      "description": "Investigate the source of the light"
    },
    {
      "id": "investigate_sound",
      "label": "Investigate the dripping sound",
      "stat": "INT",
      "dice": "1d20",
      "dc": 10,
      "type": "exploration",
      "description": "Search for the source of dripping water"
    },
    {
      "id": "search_goblin",
      "label": "Search the goblin's body",
      "stat": "WIS",
      "dice": "1d6",
      "dc": 8,
      "type": "exploration",
      "description": "Look for clues, maps, or hidden items"
    },
    {
      "id": "rest",
      "label": "Rest and recover",
      "stat": null,
      "dice": null,
      "dc": null,
      "type": "rest",
      "description": "Recover HP (short rest)"
    },
    {
      "id": "shout_challenge",
      "label": "Shout a challenge into the darkness",
      "stat": "CHA",
      "dice": "1d8",
      "dc": 14,
      "type": "social",
      "description": "Intimidate any hidden enemies"
    },
    {
      "id": "set_trap",
      "label": "Set a makeshift trap at the gate",
      "stat": "DEX",
      "dice": "1d8",
      "dc": 13,
      "type": "combat",
      "description": "Use the goblin's scimitar and rope as a tripwire"
    }
  ],
  "customActionHint": "Or describe your own action..."
}
```

### Action List Rules

| Rule | Detail |
|------|--------|
| **Count** | 4-8 actions per scene |
| **Variety** | Mix types: combat, exploration, social, rest |
| **Dice sizes** | `1d20` (standard check), `1d6` (simple task), `1d8` (moderate risk), `1d12` (dangerous), `2d6` (variable outcome), `1d4` (minor) |
| **Stat linkage** | Each action maps to exactly one character stat |
| **Rest actions** | `stat: null, dice: null, dc: null` — no roll needed |
| **DC scaling** | Easy 8-10, Moderate 11-14, Hard 15-17, Very Hard 18-20 |
| **Custom action** | Always available — user can type their own |

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `narrative` | Yes | 2-4 sentences describing what happened |
| `enemies` | Yes | Current enemies list (can be empty). Updated HP after this turn. |
| `environment` | Yes | Current location, lighting, features, modifiers |
| `systemEvents` | No | Array of state-change events (XP, loot, damage, inspiration, etc.) |
| `actions` | Yes | 4-8 possible next actions with stat + dice + DC |
| `customActionHint` | No | Hint text shown below custom action textarea |

---

## LLM System Prompt (sent every DnD turn)

```
You are Mira, Dungeon Master. You respond with EXACTLY ONE JSON object.
No markdown, no code blocks, no text outside JSON.

The player just took an action.

ACTION: "{actionText}"
Action ID: {actionId}
{customAction ? "This was their own creative idea." : "They chose from your suggested options."}
{inspirationSpent ? "✨ They spent an Inspiration token!" : ""}

DICE RESULT:
- Natural roll: {naturalRoll} on {diceNotation}
{advantageRoll ? `- Advantage roll: {advantageRoll} (took higher: {finalNaturalRoll})` : ""}
- Modifier: {modifier >= 0 ? `+{modifier}` : modifier}
{passiveNotes.length > 0 ? `- Passive bonuses: {passiveNotes.join("; ")}` : ""}
- Total: {total}
- Target DC: {dc}
- Result: {isCrit ? "CRITICAL SUCCESS" : isFumble ? "CRITICAL FAILURE" : total >= dc ? "SUCCESS" : "FAILURE"}

INSPIRATION TOKENS: {currentInspiration} remaining

CAMPAIGN CONTEXT:
- Location: {campaign.world.currentLocation}
- Character: {character.name} ({character.className}, Level {character.level})
- HP: {character.hp.current}/{character.hp.max}
- AC: {character.ac}
- Active enemies: {enemies list with current HP/AC}
- Quest: {campaign.story.mainQuest}

YOUR RESPONSE MUST BE EXACTLY THIS JSON STRUCTURE:

{
  "narrative": "2-4 sentences describing the outcome of their action. Be vivid and specific.",
  "enemies": [
    {
      "id": "enemy_id",
      "name": "Enemy Name",
      "hp": { "current": 7, "max": 7 },
      "ac": 15,
      "status": "alive | wounded | defeated | dead",
      "description": "Brief visual description of current state"
    }
  ],
  "environment": {
    "location": "Current location name",
    "lighting": "bright | dim | dark",
    "features": ["visible feature 1", "visible feature 2"],
    "lightingMod": "How lighting/environment affects what the player sees",
    "weather": null,
    "timeOfDay": "night",
    "dangerLevel": 3
  },
  "systemEvents": [
    { "tool": "dnd_xp", "amount": 50, "reason": "Why XP was awarded" },
    { "tool": "dnd_loot", "gold": 8, "items": ["item1"], "xp": 0 },
    { "tool": "dnd_damage", "target": "player", "amount": 3, "source": "counterattack" },
    { "tool": "dnd_inspiration", "amount": 1, "reason": "Creative tactic" },
    { "tool": "dnd_heal", "target": "player", "amount": 5 },
    { "tool": "dnd_flag", "flag": "goblin_defeated", "value": true },
    { "tool": "dnd_quest_update", "id": "q1", "progress": 0.5, "status": "active" },
    { "tool": "dnd_rest", "type": "short", "hpRecovered": 6 }
  ],
  "actions": [
    {
      "id": "unique_action_id",
      "label": "Short action label for button",
      "stat": "STR | DEX | CON | INT | WIS | CHA",
      "dice": "1d20 | 1d6 | 1d8 | 1d12 | 2d6 | 1d10 | 1d4",
      "dc": 12,
      "type": "combat | exploration | social | rest",
      "description": "What this action involves"
    }
  ],
  "customActionHint": "Or describe your own action..."
}

RULES FOR NARRATIVE:
- If total >= DC: Success. Describe vividly.
- If total < DC: Failure or partial success. Make it interesting.
- If natural 20: Critical success — spectacular, extra benefits.
- If natural 1: Critical fumble — entertaining complication.
- If inspiration spent and still failed: partial success.

RULES FOR ACTIONS:
- Provide 4-8 distinct choices
- Mix action types (combat, exploration, social, rest)
- Each action has: stat, dice size, DC
- Rest actions: stat=null, dice=null, dc=null
- Use different dice sizes: 1d20 for important checks, 1d6 for simple tasks, 1d8 for moderate risk, 1d12 for dangerous actions, 2d6 for variable outcomes
- DC scales with story tension
- At least one action should be creative/unusual
- Actions should feel meaningful and different

RULES FOR ENEMIES:
- Update HP after any damage this turn
- Remove defeated enemies or mark status="defeated"
- Add new enemies if they appear in the narrative
- Keep enemy list current and accurate

RULES FOR SYSTEM EVENTS:
- Only include events that actually happened this turn
- dnd_xp: Award XP for defeating enemies or good roleplay
- dnd_loot: Give gold/items from defeated enemies or discoveries
- dnd_damage: Apply damage to player if they failed badly or took a hit
- dnd_heal: Restore HP from resting, potions, or magic
- dnd_inspiration: Award for creativity/heroism (max 5 tokens)
- dnd_flag: Toggle story flags for narrative progression
- dnd_quest_update: Update quest progress

Respond with JSON ONLY. No markdown wrappers. No code blocks. No text.
```

---

## Client JSON Parser

After `_streamDnDResponse` completes, the client:

```js
/**
 * Parse JSON response from LLM.
 * Handles both raw JSON and JSON wrapped in markdown code blocks.
 */
function parseDnDResponse(responseText) {
  // Try 1: Direct JSON parse
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.narrative && parsed.actions) return parsed;
  } catch { /* continue */ }

  // Try 2: Extract from ```json code blocks
  const codeBlockMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.narrative && parsed.actions) return parsed;
    } catch { /* continue */ }
  }

  // Try 3: Find JSON object with "narrative" and "actions" keys
  const jsonMatch = responseText.match(/\{[\s\S]*"narrative"[\s\S]*"actions"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.narrative && parsed.actions) return parsed;
    } catch { /* continue */ }
  }

  // Try 4: Last resort — find any JSON object
  const anyJson = responseText.match(/\{[\s\S]*\}/);
  if (anyJson) {
    try { return JSON.parse(anyJson[0]); } catch { /* continue */ }
  }

  // Fallback: return narrative-only response
  return {
    narrative: responseText,
    enemies: [],
    environment: { location: "Unknown", lighting: "dim", features: [], dangerLevel: 1 },
    systemEvents: [],
    actions: [
      { id: "continue", label: "Continue forward", stat: "WIS", dice: "1d20", dc: 10, type: "exploration", description: "Press onward" },
      { id: "rest", label: "Rest and recover", stat: null, dice: null, dc: null, type: "rest", description: "Take a breather" }
    ],
    customActionHint: "Or describe your own action..."
  };
}
```

---

## State Change Application

```js
function applySystemEvents(events, { dndCharacter, dndCampaign }) {
  const char = { ...dndCharacter };
  const campaign = { ...dndCampaign };
  const notifications = [];

  for (const event of events) {
    switch (event.tool) {
      case 'dnd_xp':
        char.xp = (char.xp || 0) + event.amount;
        if (char.xp >= char.xpToNext) {
          char.level += 1;
          char.xp -= char.xpToNext;
          char.xpToNext = Math.floor(char.xpToNext * 1.5);
          char.hp.max += 5;
          char.hp.current = char.hp.max;
          notifications.push({ type: 'achievement', message: `🎉 Level Up! You are now level ${char.level}!` });
        }
        notifications.push({ type: 'xp', message: `⭐ +${event.amount} XP — ${event.reason}` });
        break;

      case 'dnd_loot':
        char.gold = (char.gold || 0) + (event.gold || 0);
        if (event.items?.length) {
          char.inventory = [...(char.inventory || []), ...event.items];
        }
        const lootParts = [];
        if (event.gold) lootParts.push(`+${event.gold} gold`);
        if (event.items?.length) lootParts.push(event.items.join(', '));
        if (lootParts.length) notifications.push({ type: 'loot', message: `💰 ${lootParts.join(', ')}` });
        break;

      case 'dnd_damage':
        if (event.target === 'player') {
          const before = char.hp.current;
          char.hp.current = Math.max(0, char.hp.current - event.amount);
          if (char.hp.current === 0) {
            notifications.push({ type: 'danger', message: `💀 You took ${event.amount} damage and are unconscious! Death saves begin...` });
          } else {
            notifications.push({ type: 'danger', message: `💔 -${event.amount} HP (${before}→${char.hp.current}) from ${event.source}` });
          }
        }
        break;

      case 'dnd_heal':
        if (event.target === 'player') {
          const before = char.hp.current;
          char.hp.current = Math.min(char.hp.max, char.hp.current + event.amount);
          notifications.push({ type: 'info', message: `💚 +${event.amount} HP (${before}→${char.hp.current})` });
        }
        break;

      case 'dnd_inspiration':
        char.inspiration = Math.min(5, Math.max(0, (char.inspiration || 0) + event.amount));
        notifications.push({ type: 'inspiration', message: `✨ +${event.amount} Inspiration (${char.inspiration} total) — ${event.reason}` });
        break;

      case 'dnd_flag':
        campaign.story = campaign.story || {};
        campaign.story.storyFlags = { ...campaign.story.storyFlags, [event.flag]: event.value };
        break;

      case 'dnd_quest_update':
        const quest = (campaign.story?.sideQuests || []).find(q => q.id === event.id);
        if (quest) {
          quest.progress = event.progress;
          quest.status = event.status;
          notifications.push({ type: 'info', message: `📋 Quest "${quest.title}" updated: ${event.status}` });
        }
        break;

      case 'dnd_levelup':
        char.level = event.newLevel;
        if (event.statChanges) {
          char.hp.max += event.statChanges.hp || 0;
          char.ac += event.statChanges.ac || 0;
          char.hp.current = char.hp.max;
        }
        break;

      case 'dnd_rest':
        if (event.type === 'short') {
          const recovered = Math.floor(char.hp.max / 2);
          char.hp.current = Math.min(char.hp.max, char.hp.current + recovered);
          notifications.push({ type: 'info', message: `🏕️ Short rest: +${recovered} HP` });
        } else {
          char.hp.current = char.hp.max;
          notifications.push({ type: 'info', message: `🛏️ Long rest: Full HP restored` });
        }
        break;
    }
  }

  // Update enemies from response
  if (response.enemies) {
    if (campaign.combat) {
      campaign.combat.enemies = response.enemies.filter(e => e.status !== 'dead');
    }
  }

  return { char, campaign, notifications };
}
```

---

## UI Visibility Timeline

```
Timeline:
  0s    User clicks [A] or Submit custom action
  0.0s  Dice rolled (client), prompt sent to LLM
  0.1s  Scene card shows "submitted" state (choices grayed out, feedback shown)
  0.1s  Dice animation message appears
  0.1-2s  Dice numbers cycle rapidly (3→17→9→14→20→6→17...)
  2s    Dice reveals final result: "17 + 3 = 20 vs DC 13 → SUCCESS"
  2s    Dice message removed from chat
  2s    LLM narrative streams in (already streaming, just becomes visible)
  2-5s  LLM streams JSON (typing animation for narrative text)
  5s    Stream complete
  5.1s  Client parses JSON response
  5.1s  System events applied (XP, loot, damage, etc.)
  5.1s  ToolNotifications appear below narrative
  5.1s  Next DnDSceneCard renders with new action buttons (showing stat+dice+DC)
  5.1s  Campaign saved to localStorage
  5.2s  RightPanel character sheet updates (HP, XP, inventory)
```

---

## Special Flows

### Rest Action (no dice roll)
- User clicks "Rest" (stat=null, dice=null, dc=null)
- NO dice animation
- Simple prompt: "The player rests. Narrate and return JSON."
- LLM responds with JSON including systemEvents for HP recovery

### Combat Mode
- When enemies are present, action buttons show combat context
- Each turn: roll → attack narrative → enemy HP update → next turn
- Enemy list in JSON updates with current HP after each turn
- When all enemies defeated, LLM transitions to exploration

### Death Saves
- When HP = 0, special `dnd_death` scenario
- Roll 1d20: 10+ = success, <10 = failure
- 3 successes = stable (recover with 1 HP)
- 3 failures = dead
- Each save is its own turn with narrative

### Custom Action Evaluation
- User types custom action → client sends to LLM
- LLM responds with JSON containing:
  - Whether action is approved/denied/partial
  - What dice to roll (stat + dice size + DC)
  - If denied: suggested alternative
- If approved: roll dice → proceed normally
- If denied: show alternative, let player choose

### Inspiration System
- Earned through: creativity, good roleplay, selfless heroism
- Spent for: advantage on any roll (roll 2d20, take higher)
- Maximum: 5 tokens
- Displayed in: DnDCharacterSheet, scene card toggle

---

## Files to Create/Modify

### Create
- `src/lib/dnd/dnDPromptBuilder.js` — Builds the complete DnD system prompt
- `src/lib/dnd/dnDResponseParser.js` — Parses JSON response from LLM
- `src/lib/dnd/dnDStateApplier.js` — Applies system events to campaign/character

### Modify
- `src/lib/state/useStore.js` — `handleDnDChoice` to use new flow
- `src/lib/components/DnDSceneCard.jsx` — Render action buttons with stat+dice+DC
- `src/lib/components/ToolRenderer.jsx` — Handle all dnd_* tools
- `src/styles/app.scss` — Add styles for action buttons grid

---

## Acceptance Criteria

1. ✅ Every DnD turn: action → dice roll → LLM JSON → narrative + next scene
2. ✅ LLM responds with pure JSON containing narrative, enemies, environment, actions
3. ✅ Each action shows: label + stat + dice size + DC
4. ✅ Dice animation shows known result while LLM streams in background
5. ✅ System events (XP, loot, damage, inspiration) show as ToolNotifications
6. ✅ Next scene card renders with new action buttons
7. ✅ Campaign state persists across browser refresh
8. ✅ Custom actions supported with LLM evaluation
9. ✅ Inspiration can be spent for advantage
10. ✅ Passive skills trigger correctly
11. ✅ Rest actions skip dice animation
