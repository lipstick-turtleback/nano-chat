# Tool System Architecture — Right Column + In-Chat

> Created: 2026-04-10
> Status: Planning → Implementation

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  [Sidebar: 280px]  │  [Chat: flex]  │  [Right Panel: 300px] │
│                    │                │                        │
│  Companions        │  Messages      │  🎲 Challenge Button   │
│  🎓 Aria           │  💬 User msg   │                        │
│  🧘 Kai            │  🤖 AI msg     │  ───────────────────   │
│  ⚡ Nova           │  🧠 Quiz card  │  📊 Progress Tracker   │
│  ...               │  🎲 Dice roll  │  Level: B2 → C1       │
│                    │  ⚔️ DnD fight  │  Streak: 🔥 5 days    │
│  [AI Provider]     │                │  Achievements: 12/50  │
│  [Settings ⚙️]    │  [Input]       │                        │
└────────────────────┴────────────────┴────────────────────────┘
```

---

## Tool Visibility Matrix

### In-Chat Tools (rendered inline when LLM calls them)
These tools produce interactive cards in the chat flow:

| Tool | Trigger | Behavior |
|------|---------|----------|
| `quiz` | LLM returns JSON | Renders quiz card, user submits, result sent to AI |
| `true_false` | LLM returns JSON | 5 T/F statements, one at a time |
| `fill_blank` | LLM returns JSON | Fill in blanks, check answers |
| `word_match` | LLM returns JSON | Match words to definitions |
| `riddle` | LLM returns JSON | Type answer, reveal with hint |
| `word_ladder` | LLM returns JSON | Step-by-step word changes |
| `emoji_pictionary` | LLM returns JSON | Guess from emojis |
| `would_you_rather` | LLM returns JSON | A/B choice with discussion |
| `dice_roll` | LLM or user | Animated dice, result to AI |
| `two_truths_lie` | LLM returns JSON | Find the lie |
| `sequence` | LLM returns JSON | Complete the pattern |
| `anagram` | LLM returns JSON | Unscramble |
| `reorder` | LLM returns JSON | Correct sentence order |
| `dnd_fight` | LLM (Mira only) | Full combat UI with enemy, HP, actions |

### Right Column — Persistent Widgets

#### 1. 🎲 Challenge Button (always visible)
- Generates a random creative challenge
- Sends it as a tool card to chat

#### 2. 📊 Progress Tracker (per-companion)
- Current level/grade
- Session count
- Streak (consecutive days)
- Skills radar (for language tutors: vocab, grammar, listening, speaking, writing)
- Recent achievements

#### 3. 🏆 Achievements (collapsible)
- List of unlocked achievements with dates
- Progress bar toward next achievement
- Categories: vocabulary, grammar, creativity, consistency, challenges

#### 4. 🗂️ Saved Memories (expandable key-value store)
- Companion's notes about the user
- Grouped by category: strengths, weaknesses, goals, interests
- Editable by user
- Deletable entries

#### 5. ⚔️ DnD Panel (only for Mira)
- Character card (name, class, level, HP, stats)
- Party members (if multiplayer in future)
- Current location in campaign
- Quick inventory
- Active quests

#### 6. 🗺️ Campaign Map (only for Mira, when DnD active)
- Simple node-based map
- Current location highlighted
- Visited locations marked
- Fog of war for unexplored areas

---

## Data Flow

### Challenge Generation
```
User clicks 🎲 in right panel
    → Store: requestChallenge()
    → Server: /api/challenges/generate
    → LLM returns JSON tool
    → Tool rendered as card in chat
    → User interacts
    → Result sent back to AI for feedback
```

### Progress Tracking
```
After each tool completion:
    → Store: handleToolSubmit()
    → Updates: messagesThisSession++, knowledge extraction check
    → If 10 messages → trigger knowledge extraction
    → Extractor calls LLM → saves to SQLite
    → Right panel updates with new stats
```

### DnD Combat
```
Mira starts fight:
    → LLM returns {"tool": "dnd_fight", "content": {enemy, player, map}}
    → Renders full combat UI in chat
    → User clicks actions (Attack, Defend, Magic, Item, Flee)
    → Each action → dice roll → damage calc → update UI
    → Fight state persists in right panel
```

---

## Implementation Phases

### Phase 1: Right Panel Foundation
- [ ] Create RightPanel.jsx component
- [ ] Add layout: Sidebar | Chat | RightPanel
- [ ] Responsive: right panel hides on mobile
- [ ] Challenge button with 🎲
- [ ] Progress tracker widget (sessions, streak, level)

### Phase 2: Achievements + Memories
- [ ] Achievement system (50 achievements, categories)
- [ ] Achievements widget in right panel
- [ ] Saved memories widget (expandable key-value store)
- [ ] Fetch from /api/storage/:companionId on companion select

### Phase 3: DnD Panel (Mira only)
- [ ] DnD character card widget
- [ ] Party stats display
- [ ] Campaign location display
- [ ] Inventory list
- [ ] Quick action buttons

### Phase 4: DnD Fight Simulator
- [ ] dnd_fight tool type
- [ ] Full combat UI in chat (enemy HP bar, player HP bar, action buttons)
- [ ] Action list: Attack, Defend, Magic, Item, Flee
- [ ] Dice rolls for attack damage, saving throws
- [ ] Enemy AI for counterattacks
- [ ] Victory/defeat screens with XP rewards

### Phase 5: Tool-Aware AI Feedback
- [ ] After tool completion, send result to AI
- [ ] AI gives personalized feedback
- [ ] AI suggests next challenge based on performance
- [ ] AI saves memory about user performance

---

## Achievement System

### Categories
| Category | Achievements |
|----------|-------------|
| Vocabulary | Word Collector (10), Lexicon Master (50), Dictionary (100) |
| Grammar | Grammar Guru, Syntax Sense, Rule Book |
| Challenges | First Challenge, Challenge Runner (10), Challenge Master (50) |
| Streak | Day 1, Week Warrior (7), Monthly Master (30) |
| Accuracy | Perfect Score, Unstoppable (5 perfect), Flawless (10 perfect) |
| Exploration | First DnD, Dragon Slayer, Campaign Complete |
| Social | Share Your Score, Help a Friend, Community Builder |

### Achievement Data Structure
```json
{
  "id": "first_challenge",
  "name": "First Steps",
  "description": "Complete your first challenge",
  "category": "challenges",
  "icon": "🌟",
  "xpReward": 50,
  "unlockedAt": "2026-04-10T12:00:00Z"
}
```
