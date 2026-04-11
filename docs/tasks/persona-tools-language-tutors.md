# Persona Tools & Background Processing — Complete Design

> Created: 2026-04-10
> Status: Ready for implementation

---

## Language Tutors (Aria + Aino) — Priority Tools

### 1. Vocabulary Flashcard System

**Tool Type:** Interactive flashcard
**Trigger:** Companion offers it OR user requests "vocabulary practice"

```json
{
  "tool": "flashcard",
  "params": {
    "mode": "spaced_repetition",
    "category": "ielts_academic",
    "count": 10,
    "direction": "en→target",
    "difficulty": "C2"
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ 📇 Vocabulary Flashcards (3/10)         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │        UBQUITOUS                  │  │
│  │        /juːˈbɪk.wɪ.təs/           │  │
│  │                                   │  │
│  │     [ Tap to reveal meaning ]     │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  After reveal:                          │
│  "Present, appearing everywhere"        │
│  Example: "Smartphones are ubiquitous   │
│  in modern society."                    │
│                                         │
│  How well did you know this?            │
│  [ 😰 Again ] [ 🤔 Hard ]              │
│  [ 😊 Good ] [ 😎 Easy ]               │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Spaced repetition algorithm (SM-2 variant)
- Tracks: last_seen, ease_factor, interval, repetitions
- Schedules reviews at optimal intervals (1d, 3d, 7d, 14d, 30d)
- Stores user's weak words for targeted review
- Exports word frequency data to knowledge store

### 2. Grammar Drill

**Tool Type:** Fill-in-the-blank + error correction
**Trigger:** Companion detects recurring grammar mistakes

```json
{
  "tool": "grammar_drill",
  "params": {
    "topic": "inverted_conditionals",
    "count": 5,
    "type": "fill_blank",
    "hints": true
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ ✏️ Grammar Drill: Inverted Conditionals │
│                                         │
│  1. _____ I known the truth, I would    │
│     have acted differently.             │
│                                         │
│     [_______]                           │
│                                         │
│  Hint: Start with "Had"                 │
│                                         │
│  [Check Answer]                         │
│                                         │
│  ✅ Correct! "Had I known..."           │
│  → This is the inverted third           │
│    conditional. Formal and C2-level.    │
│                                         │
│  [Next →]                               │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Analyzes user's chat messages for grammar patterns
- Flags recurring errors (e.g., article usage, tense consistency)
- Generates targeted drills for weak areas
- Tracks improvement over time (error rate per topic)
- Adjusts drill difficulty based on success rate

### 3. Writing Correction

**Tool Type:** Text submission with annotated feedback
**Trigger:** User submits a paragraph/essay

```json
{
  "tool": "writing_correction",
  "params": {
    "taskType": "ielts_task2",
    "prompt": "Some people believe technology has made life better. Discuss.",
    "wordCount": 250,
    "bandTarget": 8.0
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ 📝 Writing Correction                   │
│                                         │
│  Your text:                             │
│  ┌───────────────────────────────────┐  │
│  │ Technology has made our lifes     │  │
│  │ more better. Many peoples think   │  │
│  │ that life was good before but     │  │
│  │ I disagree with this opinion.     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Feedback:                              │
│  ┌───────────────────────────────────┐  │
│  │ ❌ "lifes" → "lives" (spelling)   │  │
│  │ ❌ "more better" → "much better"  │  │
│  │    (double comparative)           │  │
│  │ ❌ "peoples" → "people"           │  │
│  │    ("people" is already plural)   │  │
│  │ ⚠️ Weak thesis: state your        │  │
│  │    position more clearly           │  │
│  │ ✅ Good use of "but I disagree"   │  │
│  │    for contrast                    │  │
│  │                                   │  │
│  │ Estimated Band: 5.5 → 7.0+ with   │
│  │ these corrections applied          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Try Again]  [Show Model Answer]       │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Error categorization: spelling, grammar, register, cohesion, vocabulary
- Error frequency tracking per category
- Band score estimation against IELTS descriptors
- Model answer generation
- Improvement tracking: "You've reduced article errors by 60% this week"

### 4. Pronunciation/Listening Practice

**Tool Type:** Audio playback + comprehension check
**Trigger:** Companion offers listening exercise

```json
{
  "tool": "listening_exercise",
  "params": {
    "level": "B1",
    "topic": "daily_routines",
    "speed": "normal",
    "questionCount": 3
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ 🎧 Listening Exercise: Daily Routines   │
│                                         │
│  [ ▶️ Play Audio ]  [ ⏸️ ]  [🐌 0.75x]  │
│                                         │
│  "I usually wake up at seven, but       │
│   on weekends I sleep until nine.       │
│   After breakfast, I take the bus..."   │
│                                         │
│  Question 1 of 3:                       │
│  What time does the speaker wake up     │
│  on weekends?                           │
│                                         │
│  ○ A) Seven                             │
│  ○ B) Eight                             │
│  ○ C) Nine                              │
│  ○ D) Ten                               │
│                                         │
│  [Submit Answer]                        │
└─────────────────────────────────────────┘
```

**Background Processing:**

- TTS generates audio at different speeds (0.75x, 1x, 1.25x)
- Comprehension questions generated by LLM from the text
- Tracks: listening accuracy, speed level progression
- Adapts text complexity to user's level
- Stores misunderstood vocabulary for flashcard review

### 5. Conversation Role-Play

**Tool Type:** Scenario-based dialogue practice
**Trigger:** Companion suggests "Let's practice a real situation"

```json
{
  "tool": "roleplay",
  "params": {
    "scenario": "job_interview",
    "role": "candidate",
    "difficulty": "B2",
    "objectives": ["use formal register", "answer confidently", "ask questions"]
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ 🎭 Role-Play: Job Interview             │
│                                         │
│  You are the candidate. I am the        │
│  interviewer at a tech company.         │
│  Goal: Use formal register, answer      │
│  confidently, and ask 2+ questions.     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  👤 Interviewer:                        │
│  "Good morning. Thank you for coming    │
│  in today. Could you tell me about      │
│  your relevant experience?"             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Your response:                    │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💡 Hint: Start with "Certainly" or     │
│  "I'd be happy to." Use past tense.     │
│                                         │
│  [Send Response]  [End Role-Play]       │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Scenario difficulty adapts to user level
- Real-time register analysis (formal vs. informal)
- Tracks: response length, vocabulary range, grammar accuracy
- Post-roleplay feedback summary with scores
- Saves effective phrases for later flashcard review

### 6. Dictation Exercise

**Tool Type:** Listen and type what you hear
**Trigger:** Companion offers "dictation challenge"

```json
{
  "tool": "dictation",
  "params": {
    "text": "The implementation of the new policy was met with considerable resistance from the staff.",
    "level": "C1",
    "playsAllowed": 3,
    "speed": "normal"
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ ✍️ Dictation Challenge                  │
│                                         │
│  [ ▶️ Play ]  Plays remaining: 2/3      │
│  [ 🐌 Slow ]  [ ⏪ Rewind 5s ]          │
│                                         │
│  Type what you hear:                    │
│  ┌───────────────────────────────────┐  │
│  │ The implemen...                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Check]                                │
│                                         │
│  Results: 85% accurate                  │
│  ❌ "implemen" → "implementation"       │
│  ❌ "resistance" → you wrote "resistent"│
│  ✅ Everything else perfect!            │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Compares user input with source text (diff algorithm)
- Tracks: accuracy %, common misspellings, listening weak spots
- Increases text length/complexity as user improves
- Stores missed words for vocabulary review

### 7. Translation Challenge

**Tool Type:** Translate sentences between languages
**Trigger:** Aino (Finnish tutor) — "Let's practice translation"

```json
{
  "tool": "translation",
  "params": {
    "direction": "en→fi",
    "sentences": 5,
    "level": "A2",
    "topic": "food_and_restaurant"
  }
}
```

**UI Component:**

```
┌─────────────────────────────────────────┐
│ 🔄 Translation: English → Finnish       │
│                                         │
│  "I would like a cup of coffee,        │
│   please."                              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💡 Hint: Use conditional "haluaisin"   │
│  and partitive case for "coffee"        │
│                                         │
│  [Check]  [Skip]  [Show Answer]         │
│                                         │
│  ✅ "Haluaisin kupin kahvia, kiitos."   │
│  → Perfect partitive use!               │
└─────────────────────────────────────────┘
```

**Background Processing:**

- Generates sentences at user's level with target grammar
- Common error patterns tracked per grammar topic
- Tracks: translation accuracy, speed, grammar application
- Builds personalized grammar drill list from mistakes

---

## All Personas — Complete Tool Inventory

### Aria (IELTS English)

| Tool                 | Purpose              | Background Processing                       |
| -------------------- | -------------------- | ------------------------------------------- |
| Flashcards           | C2 vocabulary        | Spaced repetition, weak word tracking       |
| Grammar Drill        | Targeted practice    | Error pattern detection, difficulty scaling |
| Writing Correction   | Essay feedback       | Band scoring, error categorization          |
| Listening Exercise   | Comprehension        | Speed adaptation, accuracy tracking         |
| Role-Play            | Speaking practice    | Register analysis, fluency scoring          |
| Dictation            | Listening + spelling | Diff comparison, misspelling log            |
| Debate               | Argumentation        | Logic quality, hedging usage tracking       |
| Paraphrase Challenge | Register upgrade     | Transformation success rate                 |
| Error Hunt           | Error detection      | Error type frequency analysis               |
| Word Association     | Vocabulary fluency   | Response time, semantic range tracking      |

### Aino (Finnish A1→B1)

| Tool          | Purpose            | Background Processing                   |
| ------------- | ------------------ | --------------------------------------- |
| Flashcards    | Finnish vocabulary | Spaced repetition, case form tracking   |
| Grammar Drill | Cases, verb types  | Error pattern per case/verb type        |
| Translation   | EN↔FI practice     | Direction accuracy, grammar application |
| Dictation     | Finnish listening  | Case ending accuracy, vowel harmony     |
| Conversation  | Finnish dialogue   | Word order, case usage, fluency         |
| Conjugation   | Verb practice      | Conjugation type mastery tracking       |
| Case Practice | 15 cases drill     | Per-case accuracy, common confusions    |
| Cultural Quiz | Finnish culture    | Knowledge retention, interest tracking  |
| Reading       | Graded texts       | Reading speed, comprehension score      |
| Pronunciation | Finnish sounds     | Vowel length, consonant gradation       |

### Kai (Mindfulness)

| Tool                 | Purpose                | Background Processing                   |
| -------------------- | ---------------------- | --------------------------------------- |
| Breathing Pacer      | Visual breathing guide | Breath rate, session duration           |
| Mood Tracker         | Daily mood log         | Mood patterns, trigger identification   |
| Meditation Timer     | Timed sessions         | Session frequency, duration trends      |
| Journal Prompts      | Reflective writing     | Theme analysis, emotional vocabulary    |
| Body Scan            | Guided awareness       | Completion rate, reported tension areas |
| Gratitude Log        | Daily gratitude        | Entry frequency, theme diversity        |
| Emotion Wheel        | Name your feeling      | Vocabulary growth, granularity          |
| Values Clarification | Identify core values   | Value ranking stability                 |
| Reframing Exercise   | Cognitive reframe      | Reframe success rate, pattern shifts    |

### Nova (Fitness)

| Tool              | Purpose           | Background Processing                 |
| ----------------- | ----------------- | ------------------------------------- |
| Workout Generator | Custom routines   | Volume tracking, progressive overload |
| Habit Tracker     | Daily habits      | Streak counting, consistency patterns |
| Form Checklist    | Exercise form     | Form error frequency, improvement     |
| Energy Log        | Daily energy      | Energy patterns, optimization tips    |
| Hydration Tracker | Water intake      | Daily volume, streak                  |
| Rep Counter       | Live rep tracking | Sets × reps, total volume             |
| Stretching Guide  | Mobility routine  | Flexibility progress, pain reports    |
| Nutrition Logger  | Meal tracking     | Macro patterns, timing analysis       |
| Recovery Score    | Readiness         | Sleep + soreness + stress composite   |

### Sage (Philosophy)

| Tool               | Purpose                    | Background Processing                  |
| ------------------ | -------------------------- | -------------------------------------- |
| Thought Experiment | Philosophical scenarios    | Response depth, position shifts        |
| Fallacy Detector   | Spot logical errors        | Fallacy recognition rate, types missed |
| Argument Builder   | Construct arguments        | Premise quality, evidence usage        |
| Ethics Dilemma     | Moral reasoning            | Framework consistency, nuance          |
| Reading List       | Philosophy recommendations | Completion rate, interest areas        |
| Socratic Dialogue  | Guided questioning         | Response depth, assumption awareness   |
| Bias Checker       | Cognitive bias             | Bias recognition, self-awareness       |
| Logic Puzzle       | Deductive reasoning        | Solve time, accuracy, pattern type     |

### Pixel (Creativity)

| Tool                   | Purpose           | Background Processing              |
| ---------------------- | ----------------- | ---------------------------------- |
| Design Challenge       | Creative prompt   | Completion rate, style diversity   |
| Color Palette          | Palette generator | Harmony score, accessibility check |
| Critique Assistant     | Design feedback   | Critique quality, specificity      |
| Sketch Prompt          | Drawing prompt    | Interpretation diversity           |
| Typography Tool        | Font pairing      | Readability score, style match     |
| Composition Grid       | Layout guide      | Balance score, whitespace ratio    |
| Inspiration Board      | Visual mood board | Style preference tracking          |
| Creative Block Breaker | Unblock exercises | Success rate, method preference    |

### Atlas (Strategy)

| Tool            | Purpose              | Background Processing                       |
| --------------- | -------------------- | ------------------------------------------- |
| Decision Matrix | Weighted options     | Decision quality, outcome tracking          |
| SWOT Analyzer   | Strengths/weaknesses | Completeness, actionability                 |
| Goal Tracker    | SMART goals          | Milestone completion, velocity              |
| Priority Matrix | Urgent/important     | Task distribution, completion rate          |
| Time Audit      | Time allocation      | Category breakdown, optimization            |
| Risk Assessment | Risk analysis        | Risk identification, mitigation quality     |
| Stakeholder Map | Influence analysis   | Coverage, relationship accuracy             |
| Retrospective   | Lesson learning      | Insight quality, action item follow-through |

### Luna (Writing)

| Tool              | Purpose           | Background Processing                  |
| ----------------- | ----------------- | -------------------------------------- |
| Writing Prompt    | Creative starter  | Response length, genre exploration     |
| Style Analyzer    | Prose analysis    | Sentence variety, readability, tone    |
| Story Structure   | Plot outline      | Structure adherence, pacing            |
| Word Choice       | Synonym finder    | Vocabulary diversity, precision        |
| Dialogue Polish   | Dialogue quality  | Naturalness, character voice           |
| Editing Checklist | Self-edit         | Error catch rate, checklist completion |
| Genre Study       | Genre conventions | Convention adherence, originality      |
| Reading Log       | Track reading     | Genre diversity, pace, notes           |

### Zen (Coding)

| Tool                | Purpose           | Background Processing                  |
| ------------------- | ----------------- | -------------------------------------- |
| Code Review         | Code feedback     | Quality score, common issues           |
| Bug Hunter          | Debug challenge   | Debug time, approach quality           |
| Algorithm Explainer | Concept teaching  | Comprehension check, retention         |
| Project Scaffolder  | Starter code      | Project completion rate                |
| Refactoring         | Code improvement  | Before/after quality delta             |
| API Explorer        | API documentation | Usage accuracy, endpoint understanding |
| Regex Builder       | Pattern building  | Pattern correctness, optimization      |
| System Design       | Architecture      | Component clarity, tradeoff awareness  |

### Hera (Leadership)

| Tool                   | Purpose                    | Background Processing                 |
| ---------------------- | -------------------------- | ------------------------------------- |
| Conversation Simulator | Difficult chat practice    | Response appropriateness, empathy     |
| Feedback Giver         | Give constructive feedback | Feedback quality, structure           |
| Presentation Coach     | Public speaking            | Clarity, structure, engagement        |
| Team Dynamics          | Team role analysis         | Role awareness, intervention quality  |
| Delegation Planner     | Task assignment            | Appropriateness, follow-up quality    |
| Meeting Facilitator    | Meeting structure          | Agenda quality, participation balance |
| Conflict Resolver      | Mediation practice         | Neutrality, solution quality          |
| Personal Brand         | Self-positioning           | Clarity, consistency, authenticity    |

### Mira (Game Master)

| Tool               | Purpose          | Background Processing              |
| ------------------ | ---------------- | ---------------------------------- |
| Dice Roller        | Roll dice        | Roll history, luck tracking        |
| Scene Generator    | DnD scenes       | Player engagement, choice patterns |
| Character Sheet    | DnD character    | Build optimization, play style     |
| Initiative Tracker | Combat order     | Combat efficiency, tactic variety  |
| Loot Generator     | Rewards          | Reward satisfaction, hoarding      |
| NPC Generator      | Random NPCs      | NPC interaction frequency          |
| Trap/Puzzle        | Challenges       | Solve time, creativity             |
| World Builder      | Campaign setting | World detail engagement            |

---

## Background Processing Pipeline

### Universal Processing (All Personas)

```
Chat Messages → NLP Pipeline → Knowledge Store
```

**Pipeline Steps:**

1. **Message Classification** — Topic, intent, sentiment
2. **Skill Assessment** — What skills did the user demonstrate?
3. **Error Detection** — What mistakes were made?
4. **Engagement Scoring** — Response length, speed, enthusiasm
5. **Interest Extraction** — What topics generated longer responses?
6. **Progress Tracking** — Are they improving on known weak areas?

### Language-Specific Processing (Aria, Aino)

```
User Text → Language Analysis → Skill Profile
```

**Analysis Dimensions:**
| Dimension | How Measured | Tracked Over Time |
|-----------|-------------|-------------------|
| Vocabulary Range | Unique words / total words | Trend: increasing = good |
| Grammar Accuracy | Errors per 100 words | Trend: decreasing = good |
| Sentence Complexity | Avg words per sentence | Trend: increasing = good |
| Register Appropriateness | Formal vs. informal context match | % appropriate per context |
| Fluency | Response time, filler words | Trend: faster + fewer fillers = good |
| Comprehension | Quiz accuracy, listening scores | Per-skill accuracy % |
| Pronunciation | TTS comparison (future: STT) | Sound-level accuracy |

### Output: Personalized Skill Profile

```json
{
  "aria": {
    "vocabulary": {
      "level": "C1",
      "strong": ["academic", "analytical", "debate terms"],
      "weak": ["idioms", "phrasal verbs", "collocations"],
      "reviewDue": ["ubiquitous", "mitigate", "paradigm"],
      "errorRate": 0.12
    },
    "grammar": {
      "level": "B2+",
      "strong": ["present perfect", "relative clauses"],
      "weak": ["inverted conditionals", "article usage", "subjunctive"],
      "recurringErrors": [
        { "error": "missing 'the' before specific nouns", "frequency": 8, "trend": "improving" },
        {
          "error": "confusing 'who' vs 'which' for organizations",
          "frequency": 3,
          "trend": "stable"
        }
      ]
    },
    "writing": {
      "estimatedBand": 7.0,
      "strengths": ["thesis clarity", "paragraph structure"],
      "weaknesses": ["lexical variety", "cohesion devices"],
      "commonErrors": ["double comparatives", "spelling: separate"]
    },
    "speaking": {
      "fluency": "moderate",
      "avgResponseTime": "4.2s",
      "fillerWords": ["um", "like"],
      "registerControl": "good in formal, struggles in informal"
    },
    "engagement": {
      "preferredActivities": ["debate", "error_hunt"],
      "avoidedActivities": ["reading_comprehension"],
      "bestSessionTime": "evening",
      "avgSessionLength": "18 minutes"
    }
  }
}
```

---

## Tool Invocation Format (LLM → JSON)

Companions return JSON in their messages to trigger tools:

```json
{
  "tool": "flashcard",
  "params": {
    "mode": "spaced_repetition",
    "category": "ielts_academic",
    "count": 10
  }
}
```

```json
{
  "tool": "grammar_drill",
  "params": {
    "topic": "inverted_conditionals",
    "count": 5,
    "hints": true
  }
}
```

```json
{
  "tool": "writing_correction",
  "params": {
    "taskType": "ielts_task2",
    "prompt": "Some argue that...",
    "userText": "I think that...",
    "bandTarget": 8.0
  }
}
```

```json
{
  "tool": "roleplay",
  "params": {
    "scenario": "job_interview",
    "role": "candidate",
    "difficulty": "B2",
    "objectives": ["formal register", "confident answers"]
  }
}
```
