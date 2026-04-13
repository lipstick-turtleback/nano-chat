# DnD Engine — Complete Design Plan

> Created: 2026-04-12
> Status: Planning → Ready for implementation

---

## 1. Core Principles

### 1.1 The LLM is the Game Master
- Mira (the LLM) describes scenes, offers choices, interprets dice rolls, and narrates outcomes
- The client handles: dice rolling, passive skill checks, state persistence, UI rendering
- The LLM handles: narrative, scene design, choice design, outcome interpretation, state update decisions

### 1.2 Dice Drive the Narrative
- Every player action triggers a dice roll BEFORE the LLM responds
- The roll result + passive skills are sent to the LLM as structured data
- The LLM uses this data to determine and narrate the outcome
- The client does NOT pre-determine success/failure — the LLM decides based on the roll

### 1.3 State is Shared Between Client and LLM
- The client stores canonical state (HP, XP, inventory, campaign flags)
- The LLM proposes state changes through structured tool calls
- The client validates and applies changes, then persists

---

## 2. Complete Game Loop

```
┌─────────────────────────────────────────────────────────────────┐
│  1. LLM returns a DnD scene as tool JSON in a chat message     │
│     { tool: "dnd_narrative", content: { narrative, situation,   │
│       environment, enemies, choices[], systemEvents[] }}        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UI renders DnDSceneCard with:                              │
│     - Narrative text                                            │
│     - Situation summary                                         │
│     - 3-4 choice buttons (A-D)                                  │
│     - Custom action textarea                                    │
│     - ✨ Spend Inspiration toggle (if inspiration > 0)          │
│     - Enemy stat blocks (HP, AC, vulnerabilities)               │
│     - Passive skill hints (if triggered)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Player clicks a choice OR types custom action + Submit     │
│     → handleToolSubmit(messageId, tool, result)                 │
│     → detects dnd_* tool type → routes to handleDnDChoice()    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CLIENT-SIDE DICE ROLL (immediate, before LLM)              │
│     a. Extract DC and modifier from choice (or estimate)        │
│     b. Check if player spends inspiration → advantage roll      │
│     c. Roll 1d20 = naturalRoll                                 │
│     d. Check passive skills for context triggers → bonuses     │
│     e. Calculate final total                                   │
│     f. Determine crit/fumble                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. UPDATE TOOL CARD with roll result                          │
│     - Show roll on the card (natural roll, modifier, total)    │
│     - Show passive skill bonuses applied                       │
│     - Show inspiration spent indicator                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. RENDER DICE ANIMATION (src: 'dice' message)                │
│     - Cycling numbers for ~2 seconds                            │
│     - Reveal final roll with crit/fumble styling               │
│     - Shows: "17 + 3 = 20"                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. BUILD LLM PROMPT with complete context:                    │
│     - Player's action text                                     │
│     - Natural roll, advantage roll, modifier, total            │
│     - DC and whether total meets it                            │
│     - Crit/fumble flags                                        │
│     - Passive skill notes                                      │
│     - Inspiration spent flag                                   │
│     - Current inspiration count                                │
│     - Character sheet (name, class, level, HP, AC, stats)     │
│     - Active enemies with current HP/AC                        │
│     - Location, quest, story flags                             │
│     - Instructions: "Determine outcome, narrate, next scene"   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. LLM STREAMS RESPONSE (replaces dice animation)             │
│     - Dice animation message removed                           │
│     - Processing message replaced with final narrative         │
│     - LLM returns narrative + tool JSON for state updates      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. LLM RESPONSE MAY CONTAIN:                                  │
│     a. Narrative text (always) — describes the outcome         │
│     b. Embedded tool JSON for state mutations:                 │
│        - dnd_damage: { target, amount, source }               │
│        - dnd_heal: { target, amount }                         │
│        - dnd_xp: { amount }                                   │
│        - dnd_loot: { gold, items, xp }                        │
│        - dnd_inspiration: { amount }                          │
│        - dnd_quest_update: { id, progress, status }            │
│        - dnd_levelup: { newLevel, statChanges }               │
│        - dnd_flag: { flag: string, value: boolean }           │
│        - dnd_location: { locationId }                         │
│     c. Next scene choices (embedded as new tool JSON)          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. CLIENT PROCESSES STATE UPDATES                            │
│      - Parses tool JSON from LLM response                       │
│      - Validates changes (HP can't go below 0, etc.)            │
│      - Updates dndCharacter and dndCampaign in store            │
│      - Saves to localStorage via saveCampaign()                 │
│      - Renders system event notifications                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  11. UI RENDERS NEXT SCENE                                     │
│      - New narrative message with choices                       │
│      - Updated character sheet in right panel                   │
│      - System event notifications (loot, XP, inspiration)       │
│      - Loop back to step 2                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. LLM Response Format — Structured State Changes

### 3.1 The Problem
The LLM outputs freeform text. We need to extract state changes (HP, XP, loot, flags) from that text reliably.

### 3.2 The Solution — Embedded Tool JSON
The LLM embeds state-change tools as JSON code blocks within its narrative. The client scans the response text for these JSON blocks and processes them.

### 3.3 Tool JSON Format

The LLM includes tools in its response like this:

````
The goblin's scimitar clatters to the ground as it collapses.

```json
{"tool": "dnd_xp", "content": {"amount": 50, "reason": "Defeated Goblin Warrior"}}
{"tool": "dnd_loot", "content": {"gold": 8, "items": ["Goblin Ear Trophy"], "xp": 0}}
```

You notice a faint glow from the eastern tunnel...

What do you do?

A) Approach the glowing light
B) Search the goblin's body thoroughly
C) Continue deeper into the mine
D) Set up camp to rest
````

### 3.4 All State Change Tools

| Tool | Content Shape | What it Does |
|------|-------------|--------------|
| `dnd_damage` | `{ target: "player"\|"enemy_id", amount: number, source: string }` | Reduce HP |
| `dnd_heal` | `{ target: "player", amount: number }` | Increase HP (cap at max) |
| `dnd_xp` | `{ amount: number, reason: string }` | Add XP, check level up |
| `dnd_loot` | `{ gold: number, items: string[], xp: number }` | Add gold, items, bonus XP |
| `dnd_inspiration` | `{ amount: number, reason: string }` | Add/remove inspiration tokens |
| `dnd_quest_update` | `{ id: string, progress: number, status: "active"\|"complete"\|"failed" }` | Update quest |
| `dnd_flag` | `{ flag: string, value: boolean }` | Toggle story flag |
| `dnd_levelup` | `{ newLevel: number, statChanges: { hp: number, ac: number } }` | Level up character |
| `dnd_location` | `{ locationId: string }` | Move to new location |
| `dnd_item` | `{ action: "add"\|"remove"\|"equip", item: { id, name, type, damage?, uses?, passive? } }` | Modify inventory |
| `dnd_condition` | `{ target: "player", condition: string, duration: number }` | Add/remove conditions |
| `dnd_rest` | `{ type: "short"\|"long", hpRecovered: number }` | Record rest |

### 3.5 How the Client Processes Tools

After `_streamDnDResponse` completes, the client:

1. Gets the final response text
2. Scans for JSON blocks: `/\`\`\`json\n([\s\S]*?)\`\`\`/` or `/^\{[\s\S]*"tool"\s*:/m`
3. For each JSON block found:
   - Parse JSON
   - Validate the tool type and content shape
   - Apply the state change to `dndCharacter` and/or `dndCampaign`
   - Render a `ToolNotification` for the player to see
4. Save the updated campaign to localStorage
5. The next scene's choices come from a NEW tool JSON embedded at the end of the LLM's response

### 3.6 How the LLM Signals the Next Scene

The LLM embeds the next scene as a final tool JSON:

````
```json
{
  "tool": "dnd_narrative",
  "title": "The Glowing Tunnel",
  "content": {
    "narrative": "You step into the glowing tunnel...",
    "situation": "Three paths diverge ahead.",
    "environment": {
      "location": "The Whispering Depths, Level 1",
      "lighting": "dim",
      "features": ["glowing_mushrooms", "stone_archway"],
      "hidden": {
        "traps": [{"type": "tripwire", "dc": 14}],
        "loot": [{"item": "Silver Ring", "dc": 16}]
      }
    },
    "enemies": [],
    "choices": [
      {"id": "approach_light", "text": "Approach the glowing light", "type": "exploration", "dc": 12},
      {"id": "search_body", "text": "Search the goblin's body", "type": "exploration", "dc": 10},
      {"id": "go_deeper", "text": "Continue deeper into the mine", "type": "exploration"},
      {"id": "rest", "text": "Set up camp to rest", "type": "rest"}
    ]
  }
}
```
````

---

## 4. Dice Roll Specification

### 4.1 When to Roll
- **Every player action** triggers exactly ONE dice roll
- The roll happens on the CLIENT before the LLM responds
- The LLM receives the roll result and interprets it

### 4.2 How the Roll Works

```
1. Extract DC from choice.dc (default: 10)
2. Extract modifier from choice.modifier OR calculate from character stats
3. Roll 1d20 → naturalRoll
4. If inspiration spent: roll second d20, take higher → naturalRoll
5. If passive grants advantage: roll second d20, take higher → naturalRoll
6. If passive grants +N: adjustedTotal = naturalRoll + modifier + N
7. total = naturalRoll + modifier (+ passive bonuses)
```

### 4.3 DC Guidelines (LLM is instructed)

| Difficulty | DC | When to Use |
|-----------|-----|-------------|
| Easy | 8-10 | Simple actions, basic exploration |
| Moderate | 12-14 | Combat against weak enemies, searching |
| Hard | 15-17 | Traps, stealth, skilled enemies |
| Very Hard | 18-20 | Boss actions, complex puzzles |
| Nearly Impossible | 22+ | Extreme feats |

### 4.4 Modifier Calculation

The client calculates the modifier from the character's stats:

```js
const statModifiers = {
  strength: Math.floor((character.stats.strength - 10) / 2),
  dexterity: Math.floor((character.stats.dexterity - 10) / 2),
  constitution: Math.floor((character.stats.constitution - 10) / 2),
  intelligence: Math.floor((character.stats.intelligence - 10) / 2),
  wisdom: Math.floor((character.stats.wisdom - 10) / 2),
  charisma: Math.floor((character.stats.charisma - 10) / 2)
};

// If choice.stat is set, use that modifier
modifier = statModifiers[choice.stat] || 0;

// If choice has explicit modifier, use it
if (choice.modifier !== undefined) modifier = choice.modifier;
```

### 4.5 Crit and Fumble

- **Natural 20**: Critical success — LLM instructed to make it spectacular
- **Natural 1**: Critical fumble — LLM instructed to make it entertainingly bad
- These override the total vs DC comparison

---

## 5. Passive Skills Integration

### 5.1 Trigger Mapping

| Trigger | Activated When | Example Passives |
|---------|---------------|------------------|
| `always` | Every roll | Cloak of Protection (+1 AC) |
| `combat_start` | Action type is "combat" or text contains attack/fight/strike | Alert (+5 initiative), Enemy's Master |
| `pre_combat` | Same as combat_start | Enemy Vulnerabilities |
| `explore_environment` | Action type is "exploration" or text contains search/investigate/look/examine | Treasure Hunter |
| `trap_environment` | Text contains trap/wire/pit/snare/pressure | Trap Sense |
| `dark_environment` | Text contains dark/cave/tunnel/night/dim | Darkvision |
| `ancient_environment` | Text contains ancient/rune/magic/arcane/inscription | Ancient Knowledge |
| `treasure_hunter` | Text contains treasure/loot/hidden/secret/valuable | Treasure Hunter |
| `poison_save` | Action involves poison/venom/toxin | Dwarven Resilience |
| `mental_save` | Action involves fear/charm/illusion/mind | Gnome Cunning |
| `roll_1` | Natural roll is 1 | Halfling Lucky (reroll) |

### 5.2 Passive Effect Types

| Effect Type | What It Does |
|------------|-------------|
| `advantage` | Roll 2d20, take higher (only once — inspiration and passive don't stack) |
| `info_reveal` | Add a hint to the LLM prompt ("Your trap sense tingles...") |
| `stat_boost` | Add +N to the final total |
| `reroll` | If natural roll is 1, reroll once |
| `luck_points` | Grant N uses of reroll per session |
| `stat_override` | Replace a stat value (e.g., CON = 19 from Amulet of Health) |

---

## 6. Campaign State Management

### 6.1 What Gets Saved

```
localStorage['lexichat_dnd_campaign'] = {
  campaign: {
    campaignId, title, act, session, totalSessions,
    world: { name, locations, currentLocation, timeOfDay, weather, dangerLevel, dayCount },
    story: { mainQuest, sideQuests, completedQuests, storyFlags, narrativeLog },
    combat: null | { initiative, currentTurn, round, enemies, log },
    turnCount
  },
  character: {
    name, class, race, level, stats,
    hp: { current, max, temp },
    ac, speed, initiative,
    inventory: [{ id, name, type, damage?, uses?, effect?, passive? }],
    gold, xp, xpToNext,
    inspiration: number,
    passives: [{ id, name, description, source, trigger, effect }],
    conditions: []
  }
}
```

### 6.2 When to Save

- After every `_streamDnDResponse` completes (after processing state changes)
- After `selectCompanion` loads a campaign
- After `handleDnDChoice` updates inspiration
- On `beforeunload` (browser close)

### 6.3 State Validation Rules

| Rule | Enforcement |
|------|------------|
| HP ≥ 0 and HP ≤ max | Client clamps values |
| XP ≥ 0 | Client clamps |
| Gold ≥ 0 | Client clamps |
| Inspiration ≥ 0 | Client clamps |
| Level ≥ 1 | Client clamps |
| Inventory slots ≤ maxSlots | Client warns if exceeded |
| Quest progress 0-1 | Client clamps |

---

## 7. LLM System Prompt Structure

### 7.1 Base Prompt (from companion description)
- Mira's personality, DM style, narrative rules

### 7.2 DnD Schema Instructions
- Required JSON structure for scenes
- Required fields for choices
- How to embed state change tools

### 7.3 Campaign Context (injected each turn)
- Current location, time, weather
- Character sheet summary
- Active enemies with HP/AC
- Quest progress
- Story flags
- Inspiration count

### 7.4 Dice Roll Result (injected each turn)
- Natural roll, modifier, total, DC
- Crit/fumble flags
- Passive skill notes
- Inspiration spent flag

### 7.5 Instructions
- Determine outcome based on roll
- Narrate vividly
- Embed state change tools as JSON
- Present 3-4 new choices
- Award inspiration for creativity/heroism

---

## 8. Implementation Phases

### Phase 1: Fix the Core Flow
1. Fix `_streamDnDResponse` to properly render LLM response (DONE — use procId-based tracking)
2. Filter dice messages from LLM conversation history (DONE — filter by src)
3. Fix campaign.enemies → campaign.combat?.enemies in prompt
4. Add `_streamAiResponse` for non-DnD tool feedback (DONE)

### Phase 2: State Change Tool Parsing
1. Add `parseDnDToolsFromResponse(responseText)` utility
2. Add `applyDnDTool(tool, state)` function for each tool type
3. Wire up after `_streamDnDResponse` completes
4. Render `ToolNotification` for each applied tool
5. Call `saveCampaign()` after all tools applied

### Phase 3: Next Scene Extraction
1. LLM embeds next scene as `dnd_narrative` tool JSON at end of response
2. Client parses this and renders it as the next `DnDSceneCard`
3. If no next scene tool found, show "What do you do?" prompt

### Phase 4: Character Sheet Updates
1. Add inspiration display to DnDCharacterSheet (DONE)
2. Add HP/XP change animations
3. Add inventory with passive skill display
4. Add conditions display

### Phase 5: Combat State Tracking
1. Track enemy HP across turns
2. Display enemy HP bars in scene cards
3. Handle enemy deaths
4. Handle player death (death saves)

### Phase 6: Polish
1. Dice animation improvements (sound effects, better visuals)
2. Passive skill activation hints in scene cards
3. Campaign log/summary view
4. Save/load multiple campaigns

---

## 9. Example: Complete Turn Walkthrough

### Turn 1: LLM presents a scene
```
Mira 🎲:
The torchlight flickers as you descend into the Whispering Depths.
The air is damp and smells of rust and something older...

A goblin warrior stands guard before a rusted iron gate.
Its yellow eyes lock onto you. It raises a curved scimitar.

What do you do?

[A] Attack the goblin head-on (DC 13, STR)
[B] Try to sneak past through the narrow side passage (DC 14, DEX)
[C] Shout a challenge and try to intimidate it (DC 12, CHA)
[D] Cast a light cantrip to blind it (DC 10, INT)

Or describe your own action...
```

### Turn 2: Player clicks [A], spends inspiration
```
Client rolls:
  naturalRoll: 8
  advantageRoll: 16 (from inspiration)
  naturalRoll becomes: 16
  modifier: +3 (STR)
  Passive: Enemy's Master → info reveal
  total: 19 vs DC 13 → SUCCESS

Chat shows:
  🎲 [animated roll: 3, 17, 9, 14, 20, 6... → 16]
  16 + 3 = 19

Mira streams:
  You raise your sword and charge! The goblin tries to parry but your
  blade comes down like a falling star. The scimitar clatters to the
  ground as the creature collapses.

  ```json
  {"tool": "dnd_xp", "content": {"amount": 50, "reason": "Defeated Goblin Warrior"}}
  {"tool": "dnd_loot", "content": {"gold": 8, "items": ["Rusted Scimitar", "Goblin Ear Trophy"], "xp": 0}}
  ```

  You feel a spark of inspiration — your bold charge was magnificent!

  ```json
  {"tool": "dnd_inspiration", "content": {"amount": 1, "reason": "Bold charge tactic"}}
  ```

  Beyond the gate, the tunnel splits into three paths...

  ```json
  {"tool": "dnd_narrative", "title": "The Three Paths", "content": {
    "narrative": "...",
    "situation": "...",
    "choices": [...]
  }}
  ```
```

### Turn 3: Client processes state changes
```
1. Parse JSON blocks from Mira's response
2. Apply dnd_xp: character.xp += 50 → check level up (no)
3. Apply dnd_loot: character.gold += 8, add items
4. Apply dnd_inspiration: character.inspiration += 1 (was 2, now 3)
5. Apply dnd_narrative: render as next DnDSceneCard
6. Save campaign to localStorage
7. Update RightPanel character sheet
8. Show ToolNotifications for XP, loot, inspiration
```

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Client rolls dice, LLM interprets | Fast roll feedback, LLM stays creative |
| Inspiration = advantage reroll | Simple, matches DnD 5e inspiration rule |
| LLM embeds tools as JSON code blocks | Easy to parse, doesn't break narrative flow |
| One roll per action | Clean, no ambiguity |
| LLM proposes state changes, client validates | LLM is creative, client is the authority |
| Next scene embedded as tool JSON in response | Seamless transition, no extra API calls |
| Passive skills trigger on keyword matching | No need for complex context analysis |
| Campaign state is read-only for LLM, written by client via tools | Prevents LLM from corrupting state |
