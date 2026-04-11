# Phase: Background Knowledge Extraction

> Created: 2026-04-10
> Status: Ready for implementation

## Goal

Server analyzes chat logs in the background, extracts structured knowledge about the user (interests, strengths, weaknesses, goals, progress), and feeds it back to companions on next session start.

## Architecture

```
User chats with Aria
    ↓
Chat logs stored in SQLite (chat_sessions table)
    ↓
Background job triggers every N messages or on session close
    ↓
LLM extracts knowledge → structured JSON
    ↓
Knowledge saved to knowledge_store table
    ↓
Next session: knowledge injected into system prompt
    ↓
Companion greets user knowing their history
```

## Implementation Steps

### Step 1: Chat Log Storage

**Table:** `chat_sessions`

```sql
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL DEFAULT 'default',
    companion_id TEXT NOT NULL,
    messages TEXT NOT NULL,  -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);
```

**Behavior:**

- Each chat session (companion select) creates a new row
- Messages appended as JSON: `[{id, src, text, timestamp}]`
- On companion switch or browser close → `closed_at` set
- Server reads unclosed session on reconnect

### Step 2: Knowledge Extraction Prompt

```
Analyze the following chat conversation and extract important information about the user.
Focus on patterns, preferences, skills, and progress.

CHAT LOG:
{last 50 messages as text}

Respond with ONLY valid JSON:

{
  "interests": ["topic1", "topic2"],
  "strengths": ["skill the user is good at"],
  "weaknesses": ["area the user struggles with"],
  "goals": ["what the user wants to achieve"],
  "achievements": ["things the user accomplished"],
  "preferences": {
    "learningStyle": "e.g., visual, hands-on, analytical",
    "pace": "fast, moderate, or slow",
    "topicsEnjoyed": ["topics they engaged with enthusiastically"],
    "topicsAvoided": ["topics they seemed disinterested in"]
  },
  "personality": {
    "tone": "how they communicate (formal, casual, playful)",
    "confidence": "high, moderate, or low",
    "humor": "whether they use jokes/humor"
  },
  "progress": {
    "improvements": ["areas where they got better"],
    "recurringMistakes": ["errors they keep making"],
    "breakthroughs": ["moments of sudden understanding"]
  },
  "nextSteps": ["what they should work on next"]
}

Be specific. Use examples from the chat. If something is unclear, omit it.
Only include information you're confident about.
```

### Step 3: Background Processing

**Trigger conditions:**

- Every 10 messages in a session
- When user switches companions (session closes)
- When browser reconnects (unclosed session detected)

**Process:**

1. Get last N messages from `chat_sessions`
2. Send to LLM with extraction prompt
3. Parse JSON response
4. Merge with existing knowledge (update, don't replace)
5. Save to `knowledge_store`

**Merge Strategy:**

```javascript
function mergeKnowledge(existing, newKnowledge) {
  return {
    interests: mergeArrays(existing.interests, newKnowledge.interests),
    strengths: mergeArrays(existing.strengths, newKnowledge.strengths),
    weaknesses: deduplicate([...existing.weaknesses, ...newKnowledge.weaknesses]),
    goals: mergeArrays(existing.goals, newKnowledge.goals),
    achievements: deduplicate([...existing.achievements, ...newKnowledge.achievements]),
    preferences: {
      ...existing.preferences,
      ...newKnowledge.preferences,
      topicsEnjoyed: mergeArrays(
        existing.preferences.topicsEnjoyed,
        newKnowledge.preferences.topicsEnjoyed
      ),
      topicsAvoided: mergeArrays(
        existing.preferences.topicsAvoided,
        newKnowledge.preferences.topicsAvoided
      )
    },
    progress: {
      improvements: mergeArrays(existing.progress.improvements, newKnowledge.progress.improvements),
      recurringMistakes: deduplicate([
        ...existing.progress.recurringMistakes,
        ...newKnowledge.progress.recurringMistakes
      ]),
      breakthroughs: mergeArrays(
        existing.progress.breakthroughs,
        newKnowledge.progress.breakthroughs
      )
    },
    nextSteps: newKnowledge.nextSteps // Always use latest
  };
}

function mergeArrays(a, b) {
  const combined = [...a, ...b];
  return [...new Set(combined)].slice(-20); // Keep last 20
}
```

### Step 4: Knowledge Injection

When companion session starts:

```javascript
const knowledge = await getKnowledge(playerId, companionId);
const systemPrompt = companion.description + buildKnowledgeContext(knowledge);
```

**Context format:**

```
## What You Know About This User

**Strengths:** vocabulary, grammar analysis, debate
**Areas to work on:** inverted conditionals, formal register
**Goals:** IELTS Band 8.5, confident C2 conversation
**Interests:** linguistics, etymology, creative writing
**Recent achievements:** Mastered all 6 verb types, completed 15 quizzes
**Recurring mistakes:** Forgets article "the" in complex sentences
**Breakthrough moments:** Finally understood partitive case after Error Hunt game
**Learning style:** Visual, enjoys gamified exercises
**Tone:** Playful, uses humor, responds well to challenges
**Confidence:** Moderate — hesitates on complex grammar but strong in vocabulary

Use this knowledge naturally. Reference their progress ("Last time you nailed all 6 verb types — want to try harder ones today?"). Celebrate achievements. Adapt to their learning style. NEVER say "According to my notes" or "I remember from our last session" — just act like you naturally know them.
```

### Step 5: Server Routes

**`POST /api/knowledge/extract`**

```json
{
  "playerId": "default",
  "companionId": "Aria",
  "messages": [{src, text, timestamp}]
}
```

Response: `{ success: true, knowledge: {...} }`

**`GET /api/knowledge/:playerId/:companionId`**
Response: `{ knowledge: {...} }`

**`POST /api/knowledge/:playerId/:companionId`**
Body: `{ key, value }` → save/update

**`DELETE /api/knowledge/:playerId/:companionId/:key`**
→ remove

### Step 6: Database Schema

```sql
CREATE TABLE knowledge_store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL DEFAULT 'default',
    companion_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,  -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, companion_id, key)
);

CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL DEFAULT 'default',
    companion_id TEXT NOT NULL,
    messages TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    knowledge_extracted BOOLEAN DEFAULT FALSE
);
```

### Step 7: Background Job System

```javascript
// server/services/knowledgeExtractor.js

const EXTRACTION_INTERVAL_MESSAGES = 10;

export async function checkAndExtractKnowledge(playerId, companionId, messageCount) {
  if (messageCount % EXTRACTION_INTERVAL_MESSAGES !== 0) return;

  const messages = await getRecentMessages(playerId, companionId, 50);
  if (messages.length < 10) return; // Need minimum context

  const existing = await getKnowledge(playerId, companionId);
  const extracted = await extractWithLLM(messages);
  const merged = mergeKnowledge(existing, extracted);

  await saveKnowledge(playerId, companionId, merged);
  await markKnowledgeExtracted(playerId, companionId);
}
```

### Step 8: Client Integration

**On companion select:**

1. Client calls `GET /api/knowledge/:playerId/:companionId`
2. Knowledge loaded silently (no chat message)
3. System prompt augmented with knowledge
4. Companion can greet with personalized message

**During chat:**

- Every 10 messages → background extraction triggered
- No blocking, no user-facing delay
- Knowledge updates silently

**On browser close:**

- `beforeunload` → POST `/api/sessions/close` with final messages
- Server extracts knowledge from full session

### Benefits

| Benefit                 | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| Personal greetings      | "Welcome back! Last time you aced the Vocabulary Arena 🎉"              |
| Adaptive difficulty     | Companion adjusts to user's actual level                                |
| Progress awareness      | "You've been working on conditionals — want to review or push further?" |
| Interest alignment      | Companion naturally brings up topics user enjoys                        |
| Weakness targeting      | "I noticed articles still trip you up — let's do a quick drill"         |
| Achievement celebration | "3-day streak! You're on fire 🔥"                                       |

### Privacy

- All data stored locally (SQLite file)
- No data leaves the user's machine
- User can clear all knowledge via Settings
- Knowledge is companion-specific (Aria knows different things than Kai)
