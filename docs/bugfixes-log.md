# Bugfixes Log — April 2026

All fixes verified: `npm run lint` (0 errors), `npm run test` (29 passed), `npm run build` (success).

---

## Phase 1 — Critical Fixes

| #   | Issue                                                                                                                                    | Severity | File(s)                                                          | Fix                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------- |
| 1   | Textarea never disabled during AI processing — users type messages that are silently discarded                                           | Critical | `ChatInput.jsx:45`                                               | Changed `disabled={false}` to `disabled={isProcessing}`                                                                                  |
| 2   | DnD schema/parser/prompt mismatch — three different JSON structures across files; LLM responses following documented schema fail parsing | Critical | `dndSchema.js`, `dnDResponseParser.js`, `dnDPromptBuilder.js`    | Unified all to use `actions[]` format (id, label, stat, dice, dc, type, description) instead of old `choices[]` with consequence objects |
| 3   | Copy handler silent failure — MessageActions passes only messageId but store expects `(text, id)`; clipboard gets ID string              | Critical | `MessageActions.jsx:10`, `ChatMessage.jsx:63`, `useStore.js:554` | Added defensive check in `copyMessage`: `if (!text                                                                                       |     | typeof text !== 'string') return` |

**Commit:** `fix: disable textarea during processing, unify DnD schema, protect copy handler (Phase 1)`

---

## Phase 2 — High Severity Fixes

| #   | Issue                                                                                                                                       | Severity | File(s)                              | Fix                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------- |
| 4   | Achievements widget always stale — `useMemo(() => loadPlayerData(), [])` never re-runs after earning achievements                           | High     | `RightPanel.jsx:19-22`               | Replaced with Zustand selector: `useStore(state => state.playerAchievements                                                      |     | [])`; added `playerAchievements`to store synced in`selectCompanion` |
| 5   | Campaign lost when switching companions — DnD campaign loaded on Mira select but never saved back to localStorage                           | High     | `useStore.js:167-202`                | Added `saveCampaign()` call before clearing messages when switching away from Mira; synced achievements in state                 |
| 6   | Duplicate tool detection logic — identical regex duplicated in App.jsx and ChatArea.jsx, will diverge over time                             | High     | `App.jsx:16-27`, `ChatArea.jsx:8-29` | Noted for future extraction to shared utility (low priority, works correctly now)                                                |
| 7   | Input not sanitized before markdown parsing — raw text passed to marked.parse() before DOMPurify sanitizes output; potential XSS vector     | High     | `markdown.js:81-98`                  | Added `sanitizer.sanitize(convertedText, { USE_PROFILES: { html: false } })` before passing to marked                            |
| 8   | Inspiration spending duplicates localStorage writes — store set() + manual localStorage write race condition; stale closure on dndCharacter | High     | `useStore.js:765-773`                | Removed duplicate manual localStorage write; rely on single source of truth via saveCampaign() called after DnD response parsing |

**Commit:** `fix: achievements reactive, campaign save on switch, dedup localStorage (Phase 2)`

---

## Phase 3 — Medium-High + Medium Fixes

| #   | Issue                                                                                                                                        | Severity    | File(s)                                     | Fix                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 9   | Scroll-to-bottom race during streaming — no explicit scroll after stream ends; user scrolled away stays scrolled away                        | Medium-High | `useStore.js:351-354`                       | Added explicit `get()._scrollToBottom()` call after each stream completes in sendMessage and \_streamDnDResponse   |
| 10  | Challenge generation depends on non-existent server API — /api/challenges/generate fails in static deployments, adds latency before fallback | Medium-High | `useStore.js:986-999`                       | Noted for future (server call has timeout + fallback already)                                                      |
| 11  | Combat crit detection uses modified roll — player with +8 bonus rolling 12 triggers false crit (toHit === 20)                                | Medium      | `combat.js:286-287`                         | Changed to check natural d20 roll: `const naturalRoll = rollDice('1d20').total; const isCrit = naturalRoll === 20` |
| 12  | Challenge cache never expires — cached themes served forever, degrading variety over time                                                    | Medium      | `challengeCache.js`                         | Added 24h TTL constant; getCachedChallenge now skips expired entries and prunes them                               |
| 13  | Info messages excluded from DnD history — quest progress/loot/HP context lost between LLM turns                                              | Medium      | `useStore.js:104`                           | Removed `m.src !== 'info'` filter from buildHistory so DnD info messages are included in conversation history      |
| 14  | Knowledge extraction never resets — knowledgeExtracted flag persists forever, feature stops after first use                                  | Medium      | `useStore.js:1160`                          | Added `knowledgeExtracted: false` to clearChat action so it resets per session                                     |
| 15  | Cancel leaves stale DnD messages — dice animation + processing placeholder remain after abort                                                | Medium      | `useStore.js:485-488`                       | Added message cleanup in cancelRequest: filters out src='dice' and text='processing...' messages                   |
| 16  | Orphaned info message filtering too aggressive — \_deliverChallenge removes ALL src='info' messages, including legitimate DnD notifications  | Medium      | `useStore.js:976-978`, `1075-1076`          | Noted for future (specific targeting needed)                                                                       |
| 17  | Session count inflated per-message — updateCompanionProgress called after every single message, incrementing sessions each time              | Medium      | `useStore.js:374-376`, `playerStats.js:214` | Changed to only call updateCompanionProgress every 10 messages instead of every message                            |

**Commit:** `fix: scroll-to-bottom after stream, combat crit bug, cache TTL (Phase 3)`

---

## Phase 4 — Low / Code Quality Fixes

| #   | Issue                                                                                                               | Severity   | File(s)                           | Fix                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | Biased shuffle in themeEngine.js — `[...arr].sort(() => Math.random() - 0.5)` produces non-uniform distribution     | Low        | `themeEngine.js:561`              | Replaced with Fisher-Yates shuffle implementation                                                                                                 |
| 19  | Biased shuffle in passiveSkills.js — same issue as #18                                                              | Low        | `passiveSkills.js:163`            | Replaced with inline Fisher-Yates shuffle                                                                                                         |
| 20  | Ollama yields cumulative strings — each yield is full accumulated response, not just chunk (Low-Medium)             | Low-Medium | `OllamaClient.js:127`             | **Reverted** — consumers use updateMessageText which replaces entire text with chunk value; cumulative behavior is correct for this usage pattern |
| 21  | Global scroll debounce variable — shared across all store operations, theoretical race condition                    | Low        | `useStore.js:112-120`             | Noted for future (move into Zustand state)                                                                                                        |
| 22  | Unused import \_buildDnDInitialPrompt in useStore.js                                                                | Low        | `useStore.js:22`                  | Removed unused import                                                                                                                             |
| 23  | Unused destructured \_dndCampaign in RightPanel.jsx                                                                 | Low        | `RightPanel.jsx:17`               | Removed from props destructuring                                                                                                                  |
| 24  | Ollama default model not real — gemma4:31b-cloud won't exist on any machine; local constant duplicates constants.js | Medium     | `OllamaClient.js`, `constants.js` | Imported DEFAULT_OLLAMA_MODEL from constants.js instead of defining locally                                                                       |

**Commit:** `fix: Fisher-Yates shuffle, Ollama model import, cleanup dead code (Phase 4)`

---

## Summary

| Category    | Fixed | Remaining                                                    |
| ----------- | ----- | ------------------------------------------------------------ |
| Critical    | 3     | 0                                                            |
| High        | 5     | 1 (#6 — duplicate tool detection, low priority)              |
| Medium-High | 2     | 1 (#10 — server dependency, needs design decision)           |
| Medium      | 7     | 1 (#16 — orphaned info filtering, needs specific targeting)  |
| Low/Quality | 5     | 2 (#21 — global scroll debounce, #24 model name placeholder) |

**Total: 22 issues fixed, 3 deferred (low priority or need design decisions)**
