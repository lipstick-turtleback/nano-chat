# Implementation Plan — All Pending Requests

> Generated: 2026-04-10
> Based on: docs/USER_REQUESTS.md (63 requests logged)

---

## Phase 1: Wire Up Theme Challenges to Live Chat

**Priority:** High — core feature already built, just needs connection

### Tasks

- [ ] Add "🎲 Creative Challenge" button to ChatArea or ChatInput
- [ ] `requestThemeChallenge()` action in Zustand store
- [ ] Pick 3 random themes → check cache → if cached, use it
- [ ] If not cached: send prompt to LLM → parse JSON response
- [ ] Cache the result → add message with tool JSON → render interactive card
- [ ] Handle LLM errors gracefully (fallback to cached or skip)

### Files to Change

- `src/lib/state/useStore.js` — add `requestThemeChallenge()` action
- `src/lib/components/ChatArea.jsx` — add challenge button
- `src/lib/utils/themeEngine.js` — already done ✅
- `src/lib/services/challengeCache.js` — already done ✅

### Acceptance Criteria

- User clicks "🎲 Challenge" → LLM generates quiz with 3 random themes
- Quiz renders as interactive card (not markdown)
- Same theme combo reuses cached quiz (no LLM call)
- Error handling: if LLM fails, show friendly message

---

## Phase 2: Wire Up Knowledge Compression

**Priority:** High — makes companions feel personal

### Tasks

- [ ] Track message count per session in Zustand store
- [ ] After every 5 messages, trigger `compressKnowledge()`
- [ ] `compressKnowledge()`: get last 5 messages → send compression prompt → parse JSON → save to localStorage
- [ ] On companion select: load knowledge → inject into system prompt via `buildKnowledgeContext()`
- [ ] Ensure this is completely silent (no chat messages about it)

### Files to Change

- `src/lib/state/useStore.js` — add message counter + compression trigger
- `src/lib/ai/ChromePromptClient.js` — add `prompt()` method (non-streaming)
- `src/lib/ai/OllamaClient.js` — add `prompt()` method (non-streaming)
- `src/lib/services/knowledgeService.js` — already done ✅

### Acceptance Criteria

- After 5 messages, LLM silently compresses knowledge
- Switching companions shows personalized behavior (references past topics)
- No chat message about memory/knowledge — it just feels natural
- Works with both Chrome AI and Ollama providers

---

## Phase 3: Progress Dashboard

**Priority:** Medium — nice-to-have, visible growth

### Tasks

- [ ] Design progress state shape: `{ sessions, streak, achievements, quizScores, topicsCovered }`
- [ ] Track: sessions completed, quiz scores, consecutive days
- [ ] Achievement system: predefined badges (first quiz, perfect score, 7-day streak, etc.)
- [ ] Show progress indicator in sidebar or header
- [ ] Simple modal/panel for full dashboard view

### Files to Create

- `src/lib/services/progressService.js`
- `src/lib/components/ProgressDashboard.jsx`

### Acceptance Criteria

- Progress persists across sessions (localStorage)
- Achievements unlock with celebration animation
- Dashboard accessible from sidebar button
- Clean, non-intrusive design

---

## Phase 4: All 12 Tool Types in ToolRenderer

**Priority:** Medium — expand interactive capabilities

### Tasks

- [ ] Implement remaining tool types from `chatTools.js`:
  - [ ] `reflection` — journaling prompt with text input
  - [ ] `progress` — visual milestone tracker
  - [ ] `poll` — opinion gathering with vote buttons
  - [ ] `word_of_day` — flashcard-style word display
  - [ ] `code` — syntax-highlighted code block
  - [ ] `timeline` — sequential events display
  - [ ] `comparison` — side-by-side table
  - [ ] `checklist` — interactive task list
  - [ ] `rating` — star rating widget
  - [ ] `story_quiz` — story + question (extend QuizCard)
- [ ] Add styles for each tool type in app.scss
- [ ] Test each tool type renders correctly

### Files to Change

- `src/lib/components/ToolRenderer.jsx` — add all 12 tool renderers
- `src/styles/app.scss` — add tool card styles
- `src/lib/utils/chatTools.js` — already done ✅

### Acceptance Criteria

- All 12 tool types render as interactive cards
- Each tool type has proper submit/answer handling
- Results report back to store via `onToolSubmit`
- Consistent styling across all tool types

---

## Phase 5: Textarea Auto-Resize

**Priority:** Medium — UX improvement

### Tasks

- [ ] Integrate `useAutoResizeTextarea` hook into ChatInput
- [ ] Replace `rows={1}` with dynamic height
- [ ] Test with very long inputs (up to maxInputLength)
- [ ] Test with paste of multi-line text

### Files to Change

- `src/lib/components/ChatInput.jsx`
- `src/lib/hooks/useAutoResizeTextarea.js` — already done ✅

### Acceptance Criteria

- Textarea grows as user types (no scrollbar until max height)
- Shrinks when text is deleted
- Smooth height transitions
- Works with all message lengths

---

## Phase 6: Remove Tailwind Dependency

**Priority:** Low — cleanup

### Tasks

- [ ] Audit all JSX files for Tailwind class usage
- [ ] Replace any remaining Tailwind classes with SCSS equivalents
- [ ] Remove Tailwind from package.json
- [ ] Remove tailwind.config.js and postcss.config.js
- [ ] Verify build still works

### Files to Change

- All `.jsx` files (audit for `className="..."`)
- `package.json` — remove tailwindcss, postcss
- `tailwind.config.js` — delete
- `postcss.config.js` — delete

### Acceptance Criteria

- Zero Tailwind classes in JSX
- Build succeeds without Tailwind
- Styles unchanged (all moved to SCSS)

---

## Phase 7: Playwright E2E Test Execution

**Priority:** Medium — ensure E2E tests actually pass

### Tasks

- [ ] `npx playwright install` (Chromium only for speed)
- [ ] `npm run test:e2e` — fix any failing tests
- [ ] Add E2E test for quiz interaction flow
- [ ] Add E2E test for companion switching

### Files to Change

- `e2e/app.spec.js` — add quiz flow tests

### Acceptance Criteria

- All E2E tests pass
- Test covers: app load, companions, provider selection, quiz interaction
- CI-ready configuration

---

## Phase 8: Companion Button "Generate Challenge"

**Priority:** High — direct LLM interaction

### Tasks

- [ ] Add "Ask for a quiz" button per companion
- [ ] Each companion requests challenges in their specialty area
- [ ] LLM responds with JSON tool → render as interactive card
- [ ] Companion-specific challenge types (Aria = English quizzes, Kai = reflection prompts, etc.)

### Files to Change

- `src/lib/components/ChatArea.jsx` — add companion-specific action buttons
- `src/lib/state/useStore.js` — add `requestCompanionChallenge()` action

### Acceptance Criteria

- Each companion has unique challenge button
- Challenges match companion's expertise
- Results render as interactive cards

---

## Phase 9: Companion Personalities — More Depth

**Priority:** Medium — enrich the experience

### Tasks

- [ ] Add companion-specific greeting variations
- [ ] Add companion-specific challenge preferences (tool type weights)
- [ ] Add companion mood/energy system (subtle, changes over time)
- [ ] Add companion knowledge areas (what they're best at)

### Files to Change

- `src/lib/utils/constants.js` — expand companion definitions
- `src/lib/state/useStore.js` — integrate companion preferences

### Acceptance Criteria

- Each companion feels genuinely different
- Challenge types match expertise
- Greetings feel personalized

---

## Phase 10: Final Polish Pass

**Priority:** Medium — make it production-ready

### Tasks

- [ ] Fix any remaining layout shifts or janky animations
- [ ] Add loading skeletons for slow LLM responses
- [ ] Add "message sent" animation for user messages
- [ ] Add "typing..." indicator that feels natural (not just dots)
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (axe-core if possible)
- [ ] Performance audit (Lighthouse)
- [ ] Final README update with screenshots

### Acceptance Criteria

- Zero layout shifts during streaming
- Smooth 60fps animations
- Mobile layout works well
- Lighthouse scores > 80 on all metrics
- README has screenshots and demo GIF

---

## Implementation Order

```
Phase 1 (Theme Challenges) → Phase 2 (Knowledge Compression) → Phase 8 (Companion Challenge Button)
       ↓                              ↓                                    ↓
Phase 4 (All Tool Types) ←──── Phase 9 (Companion Depth) ←────────┘
       ↓
Phase 3 (Progress Dashboard) → Phase 5 (Auto-Resize) → Phase 6 (Remove Tailwind)
       ↓
Phase 7 (E2E Tests) → Phase 10 (Final Polish)
```

**Estimated:** 10 phases, ~2-3 hours each if working sequentially.
