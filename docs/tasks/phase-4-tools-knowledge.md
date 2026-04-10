# Task: Phase 4 — Interactive Tools & Knowledge System

**Status:** 🔴 Pending
**Created:** 2026-04-10
**Phase:** 4 of 8

## Description

Integrate the theme engine, challenge cache, knowledge service, and interactive tool rendering into the live app. Make quizzes, flashcards, and challenges actually render as interactive UI in chat — not just markdown text.

## Checklist

### 4.1 Theme Challenge Integration

- [ ] Add `requestThemeChallenge()` action to Zustand store
- [ ] Pick 3 random themes → check cache → generate via LLM or use cached
- [ ] Store generated challenge in cache for reuse
- [ ] Render challenge as interactive component in chat

### 4.2 Interactive Tool Renderer

- [ ] Create `ToolRenderer.jsx` component
- [ ] Render quiz: numbered options → user types answer → show result
- [ ] Render word_match: word list + shuffled defs → user matches
- [ ] Render fill_blank: text with input fields for blanks
- [ ] Render true_false: statements with T/F toggle buttons
- [ ] Render story_quiz: story text + question + options

### 4.3 Knowledge Tracking (Background)

- [ ] After every 5 messages, send compression prompt to LLM
- [ ] Store compressed knowledge in localStorage per companion
- [ ] Load knowledge on companion select (silently, no chat message)
- [ ] Augment system prompt with knowledge context
- [ ] Track: strengths, weaknesses, goals, interests, level, streak

### 4.4 Progress Dashboard

- [ ] Track sessions completed per companion
- [ ] Track quiz scores over time
- [ ] Track streak (consecutive days)
- [ ] Show progress in sidebar or header
- [ ] Achievement badges system

### 4.5 UI Polish Pass

- [ ] Harmonize all margins/padding (4px grid)
- [ ] Fix any layout shifts or jumping
- [ ] Smooth appear animations for messages
- [ ] Consistent typography scale
- [ ] Accessible focus indicators

### 4.6 Tests

- [ ] Unit tests for themeEngine (done)
- [ ] Unit tests for challengeCache (done)
- [ ] Unit tests for knowledgeService
- [ ] Unit tests for ToolRenderer
- [ ] E2E tests for quiz interaction flow
- [ ] E2E tests for companion switching with knowledge restore

## Acceptance Criteria

- "Generate a creative challenge" button in chat
- Quiz renders as interactive UI (not markdown), user can click answers
- Results show with explanation and celebration/correction
- Knowledge is silently compressed every 5 messages
- Switching companions restores their memory of the user
- Progress shows sessions completed + streak

## Dependencies

- `src/lib/utils/themeEngine.js` ✅ done
- `src/lib/utils/chatTools.js` ✅ done
- `src/lib/services/challengeCache.js` ✅ done
- `src/lib/services/knowledgeService.js` ✅ done
- New components: ToolRenderer, QuizCard, ProgressBar
- Store actions: requestThemeChallenge, submitAnswer, compressKnowledge
