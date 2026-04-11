# DnD Game Mode — Complete Design

> Created: 2026-04-10
> Status: Ready for implementation

## Overview

Interactive DnD-style RPG where the LLM acts as Dungeon Master, maintaining a persistent campaign storyline, adapting difficulty dynamically, offering scene-specific action choices, and evaluating custom player actions.

---

## 1. Campaign Structure

### 1.1 Story Arc

```
Campaign (persistent, 10+ sessions)
├── Act 1: The Hook (sessions 1-3)
│   ├── Episode 1: The Inciting Incident
│   ├── Episode 2: First Challenge
│   └── Episode 3: The Revelation
├── Act 2: The Journey (sessions 4-7)
│   ├── Episode 4-6: Rising action, allies, enemies
│   └── Episode 7: The Turning Point
├── Act 3: The Climax (sessions 8-10)
│   ├── Episode 8: Preparations
│   ├── Episode 9: The Confrontation
│   └── Episode 10: Resolution & Epilogue
```

### 1.2 Story State (persisted in SQLite)

```json
{
  "campaign": {
    "title": "The Whispering Depths",
    "genre": "dark_fantasy",
    "tone": "serious_but_with_humor",
    "act": 1,
    "episode": 2,
    "storySoFar": "Brief summary of what has happened",
    "keyNPCs": [
      { "name": "Eldric", "role": "ally", "status": "alive", "relationship": "friendly" },
      {
        "name": "The Shadow Queen",
        "role": "antagonist",
        "status": "active",
        "relationship": "hostile"
      }
    ],
    "plotThreads": {
      "main": "Investigate the whispering from the mines",
      "side": "Find the missing villagers",
      "personal": "Discover your character's forgotten past"
    },
    "worldState": {
      "location": "The Whispering Mines, Level 2",
      "timeOfDay": "night",
      "weather": "stormy",
      "dangerLevel": 3,
      "resourcesRemaining": { "rations": 4, "torches": 2, "potions": 1 }
    }
  }
}
```

---

## 2. Scene System

### 2.1 Scene Structure

Each scene/episode follows this flow:

```
┌─────────────────────────────────────────────┐
│  1. NARRATIVE (2-4 sentences)               │
│     "You descend into the damp tunnels..."  │
│                                             │
│  2. SITUATION                               │
│     What's happening right now              │
│     "Three goblins guard a rusted gate"     │
│                                             │
│  3. SUGGESTED ACTIONS (3-4 options)         │
│     [A] Attack the goblins head-on          │
│     [B] Sneak past using the side passage   │
│     [C] Try to negotiate with the goblins   │
│     [D] Cast a spell to create a distraction│
│                                             │
│  4. CUSTOM ACTION                           │
│     "Or describe your own action..."        │
│     [text input] [Submit]                   │
└─────────────────────────────────────────────┘
```

### 2.2 Scene Types

| Type        | Description                     | Difficulty Factor               |
| ----------- | ------------------------------- | ------------------------------- |
| Combat      | Fight enemies                   | Enemy HP, number, AC            |
| Exploration | Navigate, discover, investigate | Trap DC, hidden thing DC        |
| Social      | Negotiate, deceive, persuade    | NPC attitude, insight DC        |
| Puzzle      | Solve riddles, mechanisms       | Puzzle complexity               |
| Rest        | Recover, role-play, shop        | No difficulty                   |
| Boss        | Major encounter                 | Higher stats, special abilities |
| Plot        | Story advancement               | Narrative only                  |

---

## 3. Dynamic Difficulty System

### 3.1 Difficulty Factors

```javascript
const difficulty = {
  // Player-based
  playerLevel: 1, // Increases with XP
  playerClass: 'warrior', // Affects available actions
  playerHP: 12, // Current health
  playerResources: {}, // Inventory, spells remaining

  // Session-based
  recentSuccesses: 0, // Consecutive successful actions
  recentFailures: 0, // Consecutive failures
  sessionLength: 0, // Number of scenes this session
  playerEngagement: 0.5, // 0-1, based on response quality/speed

  // Story-based
  currentDangerLevel: 2, // 1-5, global difficulty
  plotImportance: 0.3, // 0-1, how critical this scene is
  previousOutcome: null // 'success', 'failure', 'partial'
};
```

### 3.2 Adjustment Logic

```javascript
function adjustDifficulty(difficulty, lastSceneResult) {
  const adj = { ...difficulty };

  // Player is on a winning streak → increase challenge
  if (difficulty.recentSuccesses >= 3) {
    adj.currentDangerLevel = Math.min(5, adj.currentDangerLevel + 1);
    adj.recentSuccesses = 0;
  }

  // Player is struggling → ease up
  if (difficulty.recentFailures >= 2) {
    adj.currentDangerLevel = Math.max(1, adj.currentDangerLevel - 1);
    adj.recentFailures = 0;
  }

  // Low HP → introduce healing opportunity
  if (difficulty.playerHP < difficulty.playerMaxHP * 0.3) {
    adj.forceRestScene = true;
  }

  // Boring/detached → spice things up
  if (difficulty.playerEngagement < 0.3) {
    adj.addSurpriseElement = true;
  }

  return adj;
}
```

### 3.3 DC Scaling

| Difficulty    | Combat DC | Exploration DC | Social DC | Puzzle DC |
| ------------- | --------- | -------------- | --------- | --------- |
| 1 (Easy)      | 8         | 8              | 8         | 8         |
| 2 (Moderate)  | 11        | 10             | 10        | 10        |
| 3 (Hard)      | 14        | 13             | 13        | 13        |
| 4 (Very Hard) | 16        | 15             | 15        | 16        |
| 5 (Deadly)    | 18        | 17             | 17        | 19        |

---

## 4. Action System

### 4.1 Suggested Actions

Each scene provides 3-4 suggested actions:

```json
{
  "suggestedActions": [
    {
      "id": "attack",
      "text": "Attack the goblins with your sword",
      "type": "combat",
      "stat": "strength",
      "skill": "melee",
      "dc": 12,
      "damage": "1d8+2",
      "risk": "medium",
      "consequence": {
        "success": "You cleave through the first goblin. Two remain, startled.",
        "failure": "Your swing goes wide. The goblins counterattack!",
        "partial": "You wound one goblin, but the others close in."
      }
    },
    {
      "id": "sneak",
      "text": "Sneak past through the narrow side passage",
      "type": "exploration",
      "stat": "dexterity",
      "skill": "stealth",
      "dc": 14,
      "risk": "low",
      "consequence": {
        "success": "You slip through unnoticed, finding a hidden stash.",
        "failure": "The passage collapses behind you — you're trapped.",
        "partial": "You make it through, but drop your torch."
      }
    }
  ]
}
```

### 4.2 Custom Actions

Player can type their own action:

```
Your action: "I throw a torch at the oil spill on the wall"
```

**GM Evaluation Process:**

```
1. Parse custom action
2. Check appropriateness for:
   - Story context (does it make sense here?)
   - Character abilities (can this character do this?)
   - Game balance (is it too overpowered?)
   - Physical possibility (is it physically possible?)

3. Determine:
   - Action type (combat/exploration/social/puzzle)
   - Relevant stat and skill
   - DC (based on difficulty + action creativity)
   - Roll type (d20 + modifier)

4. Respond:
   If APPROVED:
     "That's creative! Roll for it..."
     → Calculate DC, roll dice, resolve

   If DENIED:
     "The oil spill is too far away to reach with a torch throw.
     But you could try pouring your water skin on the nearest goblin
     to give yourself an opening. Want to try that?"

   If PARTIALLY APPROVED:
     "You can try, but the oil is old and may not ignite well.
     I'll give you disadvantage on the roll. Ready?"
```

### 4.3 Custom Action Evaluation Prompt

```
A player wants to do this: "{playerAction}"

SCENE CONTEXT:
{current scene description}
{location, enemies, objects, environment}

CHARACTER:
{name, class, level, stats, inventory, HP}

RULES:
1. Can this action physically/logically be done in this scene?
2. Does the character have the ability/knowledge to attempt it?
3. Is it balanced (not an instant-win for the situation)?

RESPOND with JSON ONLY:

{
  "approved": true | false | "partial",
  "reason": "Why it's approved/denied/modified",
  "actionType": "combat | exploration | social | puzzle | creative",
  "stat": "strength | dexterity | constitution | intelligence | wisdom | charisma",
  "skill": "specific skill name",
  "dc": 12,
  "modifier": 3,
  "advantage": true | false | "none" | "disadvantage",
  "ifApproved": "What happens on success (brief)",
  "ifDeniedAlternative": "Suggest a similar viable action if denied"
}

If denied, ALWAYS provide a constructive alternative that keeps the story going.
Never just say "no."
```

---

## 5. Game Master (Mira) — Persona

### 5.1 Identity

| Property   | Value                          |
| ---------- | ------------------------------ |
| Name       | "Mira the Game Master"         |
| Short name | "Mira"                         |
| Tagline    | "DnD & Interactive Adventures" |
| Emoji      | 🎲                             |
| Color      | #7c2d12                        |
| ColorBg    | #fff7ed                        |
| Gradient   | 7c2d12 → c2410c                |
| Category   | gaming                         |
| VoiceStyle | measured                       |

### 5.2 System Prompt (excerpts)

```
You are Mira, an expert Dungeon Master and interactive storyteller. You run DnD-style
adventures where the player is the hero. You maintain a persistent campaign storyline
across sessions.

YOUR ROLE:
- Narrate scenes vividly (2-4 sentences, sensory details)
- Present 3-4 meaningful action choices per scene
- Evaluate custom player actions fairly but creatively
- Track HP, XP, inventory, and story state
- Adjust difficulty dynamically based on player performance
- Never railroad — always honor creative solutions
- Make failure interesting, not punishing

CAMPAIGN MANAGEMENT:
- Remember the overarching story across sessions
- Track NPCs, locations, plot threads
- Escalate tension gradually (Act 1 → 2 → 3)
- Include character backstory in the plot
- Surprise the player but don't cheat

ACTION EVALUATION:
- APPROVE creative actions that make sense
- DENY only physically impossible or game-breaking actions
- When denying, ALWAYS suggest a viable alternative
- Custom actions can have higher or lower DCs based on creativity
- Reward clever thinking with advantage or lower DCs
- Never punish creativity — even if it fails, make it narratively fun

DIFFICULTY:
- Start easy, escalate based on player success
- If player fails 2x in a row, ease up
- If player succeeds 3x in a row, increase challenge
- Low HP → introduce healing/rest opportunities
- Boredom → add surprise elements (ambush, discovery, NPC arrival)
- Always keep it fun, never unfair

RESPONSE FORMAT for each scene:
1. Narration (story text)
2. Situation summary
3. Suggested actions (3-4, labeled A-D)
4. Prompt for custom action

Keep responses under 300 words. Be vivid but concise.
```

---

## 6. Dice System

### 6.1 Supported Dice

| Notation | Description                             |
| -------- | --------------------------------------- |
| `1d4`    | One 4-sided die                         |
| `1d6`    | One 6-sided die                         |
| `1d8`    | One 8-sided die                         |
| `1d10`   | One 10-sided die                        |
| `1d12`   | One 12-sided die                        |
| `1d20`   | One 20-sided die (primary resolution)   |
| `1d100`  | Percentile die                          |
| `2d6+3`  | Two d6, add 3                           |
| `3d8-1`  | Three d8, subtract 1                    |
| `4d6kh3` | Roll 4d6, keep highest 3 (stat rolling) |

### 6.2 Dice Roll Endpoint

```
POST /api/games/dice/roll
{
  "notation": "2d6+3",
  "label": "Fireball damage"
}

Response:
{
  "notation": "2d6+3",
  "label": "Fireball damage",
  "rolls": [4, 6],
  "modifier": 3,
  "total": 13,
  "breakdown": "4 + 6 + 3 = 13"
}
```

### 6.3 d20 Resolution

```
Roll: d20 + modifier vs DC

Natural 20 → Critical success (double damage, maximum effect)
≥ DC       → Success
< DC       → Failure
Natural 1  → Critical failure (comedy or extra complication)
```

---

## 7. UI Components

### 7.1 Scene Card

```
┌──────────────────────────────────────────────┐
│ 🎲 Mira the Game Master                      │
│                                              │
│ The tunnel opens into a vast cavern.         │
│ Phosphorescent mushrooms cast an eerie       │
│ green glow. Before you, a rope bridge        │
│ sways over a bottomless chasm. On the        │
│ far side, a stone door covered in runes.     │
│                                              │
│ ───────────────────────────────────────────  │
│                                              │
│ What do you do?                              │
│                                              │
│ [A] Cross the rope bridge carefully          │
│ [B] Try to decipher the runes first          │
│ [C] Throw a rock to test the bridge          │
│ [D] Search the cavern for another way        │
│                                              │
│ ───────────────────────────────────────────  │
│                                              │
│ Or describe your own action:                 │
│ ┌──────────────────────────────────────────┐ │
│ │ I tie my rope to this stalagmite and     │ │
│ │ rappel down to look for...               │ │
│ └──────────────────────────────────────────┘ │
│ [Submit Custom Action]                       │
└──────────────────────────────────────────────┘
```

### 7.2 Dice Roll Display

```
┌───────────────────────────────┐
│ 🎲 Initiative Roll            │
│                               │
│     Rolling...                │
│     (number cycles rapidly)   │
│                               │
│     ┌───┐                     │
│     │ 17│  + 2 = 19          │
│     └───┘                     │
│     (scales up with spring)   │
│                               │
│ You act first! The goblin     │
│ blinks in surprise.           │
└───────────────────────────────┘
```

### 7.3 Character Sheet Panel

```
┌─────────────────────────────────────┐
│ ⚔️  Thorin Ironforge                │
│    Warrior · Level 3                │
├─────────────────────────────────────┤
│ HP: ████████░░  8/12                │
│ XP: ██████░░░░  250/300            │
│ AC: 16  Initiative: +2             │
├─────────────────────────────────────┤
│ STR 14 (+2)  DEX 10 (+0)           │
│ CON 13 (+1)  INT 8 (-1)            │
│ WIS 12 (+1)  CHA 11 (+0)           │
├─────────────────────────────────────┤
│ 🎒 Sword (1d8+2)  Shield (+2 AC)   │
│    Potions ×2  Rations ×4          │
│    Rope  Torches ×3               │
├─────────────────────────────────────┤
│ ✨ Rage (2/3 remaining)            │
│    Second Wind (1/1 remaining)      │
└─────────────────────────────────────┘
```

---

## 8. Session Flow

```
Player selects Mira (Game Master)
    ↓
Mira checks: existing campaign? → yes: resume / no: new campaign
    ↓
New campaign:
    - Ask player for character concept
    - Roll stats (4d6kh3 × 6)
    - Generate opening scene
Existing campaign:
    - Load story state from DB
    - Summarize: "Last time, you..."
    - Generate next scene
    ↓
Scene loop:
    1. Mira narrates scene
    2. Player chooses A-D or types custom action
    3. Mira evaluates → roll dice → resolve
    4. Update story state, HP, XP
    5. Generate next scene
    ↓
Session end (player stops or 30min):
    - Save full state to SQLite
    - Extract knowledge (player preferences, play style)
    - Show session summary
```

---

## 9. Data Model (SQLite)

```sql
-- Campaign
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL DEFAULT 'default',
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    state TEXT NOT NULL,  -- Full JSON campaign state
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DnD Characters
CREATE TABLE dnd_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL DEFAULT 'default',
    campaign_id INTEGER REFERENCES campaigns(id),
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    ac INTEGER NOT NULL,
    stats TEXT NOT NULL,       -- JSON: {str, dex, con, int, wis, cha}
    inventory TEXT NOT NULL,   -- JSON array
    abilities TEXT NOT NULL,   -- JSON array
    backstory TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session Log
CREATE TABLE dnd_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES campaigns(id),
    scene_number INTEGER DEFAULT 1,
    narrative TEXT NOT NULL,
    player_action TEXT NOT NULL,
    action_type TEXT,         -- 'suggested' or 'custom'
    roll_notation TEXT,       -- e.g., "1d20+2"
    roll_result INTEGER,
    dc INTEGER,
    outcome TEXT,             -- 'success', 'failure', 'partial', 'critical'
    state_snapshot TEXT,      -- JSON of campaign state after scene
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. Implementation Priority

### Phase 1: Core Game Loop

1. [ ] Mira companion with DnD system prompt
2. [ ] Scene generation endpoint (LLM → JSON scene)
3. [ ] Suggested actions + custom action input UI
4. [ ] Dice roller (server-side, cryptographically random)
5. [ ] Action evaluation (LLM evaluates custom actions)
6. [ ] Session state save/load

### Phase 2: Campaign Persistence

1. [ ] SQLite tables for campaigns, characters, sessions
2. [ ] Campaign resume on reconnect
3. [ ] Character sheet UI component
4. [ ] HP/XP tracking
5. [ ] Story summary between sessions

### Phase 3: Dynamic Difficulty

1. [ ] Difficulty tracking state
2. [ ] Auto-adjustment logic
3. [ ] Rest scene injection
4. [ ] Surprise element injection
5. [ ] Engagement tracking

### Phase 4: Knowledge Extraction

1. [ ] Extract player preferences from DnD sessions
2. [ ] Merge with general knowledge store
3. [ ] Use play style data for companion personalization
