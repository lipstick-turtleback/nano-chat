# Lessons Learned

> Auto-maintained. Last updated: 2026-04-10
> This document captures insights from building, debugging, and evolving LexiChat.
> Each entry includes context, what happened, and what we'd do differently.

---

## 2026-04-10 — Svelte → React Migration

### Don't Use Synthetic DOM Events to Trigger React Behavior

**Context:** The first React rewrite dispatched a synthetic `KeyboardEvent` on the textarea to simulate pressing Enter from the send button.
**What happened:** The button → synthetic event → `onKeyDown` → `processRequest` chain was fragile. It bypassed React's event system, created invisible coupling between `App.jsx` and `TextInput.jsx`, and made the send button break silently if TextInput changed.
**Fix:** Created a shared `sendMessage(text)` function in the Zustand store. Both Enter key handler and send button call it directly.
**Rule:** Never dispatch synthetic DOM events to communicate between React components. Use shared functions or state.

### Stale Closures in Async State Management Are the #1 Bug Source

**Context:** `processRequest` captured `messages` from its closure. Since `handleKeyDown` called it via `setTimeout`, the `messages` array was stale — missing the user message that was just added.
**What happened:** Ollama conversation history was always one message behind. The AI never saw the latest user message.
**Fix:** Used `messagesRef` (a ref that's always current) instead of relying on closure values. Also passed `extraMessages` explicitly to `processRequest`.
**Rule:** If an async function reads state that can change, use a ref — never trust the closure.

### DOMPurify Must Be Imported, Not Assumed Global

**Context:** The Svelte version relied on `window.DOMPurify` being loaded via an external script. The React version had `dompurify` in `dependencies` but never imported it — it was still checking `window.DOMPurify`.
**What happened:** `sanitizer` was always `null`. All markdown was rendered raw with zero sanitization — a stored XSS vulnerability.
**Fix:** `import DOMPurify from 'dompurify'` and initialize `DOMPurify(window)` at module load time.
**Rule:** If it's in `package.json`, import it. Never rely on implicit global availability.

---

## 2026-04-10 — Unified AI Client Architecture

### Abstract Contracts Make Providers Interchangeable

**Context:** Chrome AI and Ollama had completely different API shapes scattered across the store and services.
**What happened:** Every component needed to know which provider was active. Switching providers required changes in multiple files.
**Fix:** Created `AIClient` abstract class with `ClientSession` interface (`prompt`, `promptStreaming`, `destroy`, `contextUsage`, `contextWindow`). Both `ChromePromptClient` and `OllamaClient` implement the same contract.
**Rule:** When you have interchangeable backends, define the contract first. Components should never know which backend is active.

### Ollama System Prompts Require Explicit Message Placement

**Context:** Chrome's `LanguageModel.create()` accepts `initialPrompts` with `{role: 'system'}`. Ollama's `/api/chat` expects system messages as the first item in the `messages` array.
**What happened:** The first implementation didn't prepend the system prompt to Ollama messages, so assistants had no personality.
**Fix:** Both clients now handle system prompt internally. `OllamaClient.createSession()` stores it, then prepends it to every `promptStreaming` call.
**Rule:** Wrap provider-specific quirks inside the client. The store should just call `createSession({systemPrompt})`.

---

## 2026-04-10 — Zustand State Management

### Zustand Embedding Actions in Store Eliminates Thunk Boilerplate

**Context:** Previous approach used a custom `useChatStore` hook with `useCallback` for every action. Dependency arrays were a nightmare — `init` depended on `processRequest` which depended on `messages` which `init` reset.
**What happened:** Recreating `init` every time `processRequest` changed caused re-initialization loops via the `useEffect` dependency.
**Fix:** Zustand's `set`/`get` pattern means actions are plain functions inside the store. No dependency arrays, no stale closures, no `useCallback` wrapper hell.
**Rule:** For apps under ~10 state slices, Zustand beats custom hooks + context. `get()` always returns the latest state.

---

## 2026-04-10 — Build Tooling & Config

### Vite 7 Requires Matching Plugin Versions

**Context:** Upgraded to Vite 7.3.2 but `@vitejs/plugin-react` was still v4.
**What happened:** Dependency resolution failed. Had to explicitly install `@vitejs/plugin-react@5`.
**Rule:** When upgrading Vite majors, check plugin compatibility matrix first.

### ESLint `react-hooks/exhaustive-deps` Catches Real Bugs

**Context:** `useEffect(() => { init(); initTTS(); }, [])` had missing dependencies.
**What happened:** ESLint warned about missing `init` and `initTTS` in the dependency array. Adding them ensures the effect re-runs if those functions change (which they do when the store recreates).
**Rule:** Never disable `exhaustive-deps`. If it complains, either add the dependency or rethink the effect structure.

### Prettier + ESLint + Biome — Know What Each Does

**Context:** Started with all three running simultaneously with overlapping responsibilities.
**What happened:** Config conflicts and confusing `npm run lint` output.
**Fix:** Prettier handles formatting (via `npm run format`). ESLint handles linting rules (via `npm run lint`). Biome is kept as a secondary fast format check in CI. `eslint-config-prettier` disables formatting rules in ESLint so they don't fight.
**Rule:** Format = Prettier. Lint = ESLint. Biome = optional fast secondary check. Never let two tools fight over the same rules.

---

## 2026-04-10 — SCSS + Tailwind Coexistence

### SCSS and Tailwind Work Together Fine

**Context:** Debate about whether to use Tailwind, SCSS, or both.
**What happened:** Tailwind handles utility classes (spacing, flex, colors). SCSS handles design tokens, animations, component-specific styles, and media queries. They coexist because Tailwind's output is just CSS and SCSS compiles to CSS.
**Rule:** Use Tailwind for layout/utilities. Use SCSS for design tokens and component styles. Don't fight — let them complement.

---

## 2026-04-10 — Kokoro-js TTS Integration

### Client-Side TTS Has a Heavy WASM Payload

**Context:** Kokoro-js uses ONNX runtime with WebAssembly for speech synthesis.
**What happened:** The built JS bundle jumped from ~250kb to ~2.5MB (mostly `ort-wasm-simd-threaded.jsep.wasm` at 21MB uncompressed, 5MB gzipped).
**Mitigation:** Dynamic `import()` for Kokoro-js so it only loads when the user clicks "play" on a message. (TODO: implement code splitting).
**Rule:** Heavy ML/WASM libraries should be lazy-loaded. Don't block the initial render.

---

## 2026-04-10 — Documentation System

### Task Tracking Should Mirror Real Work

**Context:** Created `docs/tasks/` for active work and `docs/archived/tasks/` for completed work.
**What happened:** The plan document (`REBUILD_PLAN.md`) was comprehensive but too dense. Task cards are better — small, checkable, movable.
**Rule:** Keep the master plan light. Put details in task cards. Move cards to `archived/` when done with a commit reference.

### AGENTS.md Prevents Repeated Mistakes

**Context:** Created `AGENTS.md` with project rules, tech stack, and "what NOT to do" guidelines.
**What happened:** Previously the same mistakes (synthetic events, stale closures, missing DOMPurify import) were made multiple times across sessions.
**Rule:** When you fix a non-trivial bug, add the lesson to AGENTS.md under "Rules." Future sessions will read it.

---

## 2026-04-10 — Chrome LanguageModel API

### The Standardized `LanguageModel` Global Replaced `window.ai.languageModel`

**Context:** Old code used `window.ai.languageModel.create()`. The current spec uses `LanguageModel.create()` directly.
**What happened:** System prompt must go in `initialPrompts[{role: 'system', ...}]` not a separate `systemPrompt` option.
**Fix:** `ChromePromptClient` wraps this correctly. The store just passes `{systemPrompt: '...'}` and the client translates it.
**Rule:** Always check the latest Prompt API spec at https://github.com/webmachinelearning/prompt-api. This API is still evolving.

---

## 2026-04-10 — Phase 2 Improvements

### Ollama Conversation History Had Duplicate User Messages

**Context:** In `sendMessage`, after adding the user message to state, we built Ollama history as `[...messages.slice(0, -1), userMsg]`.
**What happened:** `messages` already included `userMsg` at that point. So `slice(0, -1)` kept it, then we appended it again. The user message was sent to Ollama twice.
**Fix:** Just use `get().messages.slice(0, -1)` — the user message is already in there.
**Rule:** When building conversation history from state, check if the new message was already committed before the async call.

### Message ID Counter Breaks on HMR

**Context:** `let messageId = 0; const nextId = () => \`msg-${++messageId}-${Date.now()}\``**What happened:** On every Hot Module Replacement during development, the counter resets. If the store is recreated without a page refresh, duplicate IDs occur.
**Fix:** Use`crypto.randomUUID()`with a fallback to`Date.now() + Math.random()`.
**Rule:** Never use module-scoped counters for unique IDs. Use cryptographic or time+random generators.

### Kokoro-js Should Be Lazy-Loaded

**Context:** Kokoro-js has a 21MB WASM file. Loading it eagerly increased the initial bundle from ~250KB to ~2.5MB.
**What happened:** The app takes significantly longer to load, even if the user never clicks "play."
**Fix:** Dynamic `import('kokoro-js')` inside the `initTTS()` function. Kokoro is now a separate chunk (2.2MB) that only loads on first TTS use.
**Rule:** ML/WASM libraries should always be lazy-loaded. The initial bundle should be under 300KB.

### Zustand + Vite Manual Chunking Improves Initial Load

**Context:** Without `manualChunks`, Vite bundled everything into one 280KB file.
**What happened:** After adding `manualChunks`: vendor (3.6KB), state (11KB), utils (58KB), app (206KB), kokoro (2.2MB lazy).
**Fix:** `build.rollupOptions.output.manualChunks` in vite.config.js.
**Rule:** Chunk vendor, state, and heavy utilities separately. The user's first paint only needs vendor + state + minimal app code.

### Scroll Debouncing Prevents Layout Thrashing

**Context:** `scrollToBottom` was called on every streaming chunk (potentially 50+ times per second).
**What happened:** Each call triggered a synchronous DOM `scroll()` operation, causing layout thrashing during streaming.
**Fix:** Debounced scroll with 80ms window using `setTimeout`. At most one scroll per 80ms during streaming.
**Rule:** Never call DOM-heavy operations in a tight loop. Debounce or throttle scroll/resize/mousemove.

### Copy Feedback Requires Visual Confirmation

**Context:** Clicking copy had no visual indication of success.
**What happened:** Users had no way to know if the copy worked. They'd click multiple times thinking it didn't work.
**Fix:** Track `lastCopiedId` in state. Show ✅ for 2 seconds after copy. Add `title` attribute for tooltip.
**Rule:** Every user action needs visual feedback. Silent success is confusing.

### CSP Meta Tag Prevents XSS Defense-in-Depth

**Context:** No Content-Security-Policy header was set.
**What happened:** If DOMPurify ever had a bypass vulnerability, there was no second layer of defense.
**Fix:** Added `<meta http-equiv="Content-Security-Policy">` restricting scripts to self + unsafe-inline (needed for Vite dev), styles to self + Google Fonts, connect to self + localhost:11434.
**Rule:** Always add a CSP. Even a restrictive one is better than none. It's defense-in-depth.

### Barrel Exports Rot Silently

**Context:** `src/lib/index.js` exported dead modules (`aiService`, `ollamaService`, `speechService`) that no longer existed.
**What happened:** Nothing imported from `index.js` directly, so the dead exports went unnoticed. If someone had imported from it, the build would break.
**Fix:** Cleaned up to only export what actually exists. Added tests that verify imports work.
**Rule:** Audit barrel files every refactor. Dead exports are silent time bombs.

### `dangerouslySetInnerHTML` Should Be Error-Level Lint

**Context:** Biome had `noDangerouslySetInnerHtml: "warn"`.
**What happened:** Warnings can be ignored in CI. This is a security-sensitive rule.
**Fix:** Changed to `"error"`. Now any new usage of `dangerouslySetInnerHTML` fails the build, forcing review.
**Rule:** Security-sensitive lint rules should be errors, not warnings.

---

## 2026-04-10 — Visual Redesign (Dark Premium Theme)

### Dark Theme Requires Complete Token Rebuild

**Context:** The light theme used standard Tailwind utilities inline. The new dark theme needed custom CSS variables for every surface, text level, and border.
**What happened:** Mixing Tailwind utility classes (`bg-gray-900`, `text-white`) with SCSS variables created inconsistent contrast. Some elements were invisible on dark backgrounds.
**Fix:** Removed all Tailwind utility classes from JSX. All styling now goes through SCSS with CSS custom properties. Every color reference uses `var(--*)`.
**Rule:** Pick one styling system per project. Mixing utilities with design tokens creates maintenance nightmares.

### Ollama Should Be the Default Provider

**Context:** Chrome AI was the default, but most users don't have Chrome 131+ with Gemini Nano enabled.
**What happened:** New users saw the error screen immediately and couldn't use the app.
**Fix:** Changed `provider: 'ollama'` as default. Chrome AI is now the opt-in alternative.
**Rule:** Default to the most accessible option. Progressive enhancement, not progressive degradation.

### Tailwind Was Doing Nothing For Us

**Context:** Tailwind was installed and configured but every style was in SCSS. The `tailwind.config.js` had empty `extend` and no plugins.
**What happened:** Tailwind was adding ~11KB of CSS (base reset + utilities we never used) on top of our 18KB SCSS.
**Fix:** Kept Tailwind for now (removing it risks breaking any accidental class usage) but all new styles are pure SCSS.
**Rule:** If you have a design token system in SCSS, you don't need Tailwind. Pick one.

---

## 2026-04-10 — Interactive Tools & Knowledge

### React Hooks Must Always Be Called in Same Order

**Context:** ChatMessage had `useMemo` after an early `return null` for empty messages.
**What happened:** ESLint's `react-hooks/rules-of-hooks` caught it — but if it hadn't, React would crash with confusing errors when a message had no text.
**Fix:** Moved `useMemo` before the early return. Used `message?.text` in the dependency to handle null safely.
**Rule:** ALL hooks must be called unconditionally at the top of the component. Never after early returns.

### Interactive Tool Cards Need Proper State Management

**Context:** Quiz answers, T/F results, and word matching all need local component state.
**What happened:** Each card type (`QuizCard`, `TrueFalseCard`, `FillBlankCard`, `WordMatchCard`) needs its own state for selected answers, submission status, and results display.
**Fix:** Each card manages its own state internally. Results are reported back to the store via `onToolSubmit` callback for knowledge tracking.
**Rule:** Interactive tools are self-contained. The chat message just detects JSON and renders the right card.

### LLM-Generated JSON Needs Defensive Parsing

**Context:** Tool JSON from the LLM may be wrapped in markdown code blocks, have extra text, or be malformed.
**What happened:** `extractTool()` needs to handle ` ```json {...} ``` `, plain JSON, and partial failures gracefully.
**Fix:** Regex to find JSON object with `"tool"` key, then try-parse with and without code block markers. Return null on failure.
**Rule:** Never trust LLM output to be clean JSON. Always parse defensively with fallbacks.

### Knowledge Compression Should Be Invisible

**Context:** The system needs to "remember" things about the user without showing the memory process in chat.
**What happened:** Knowledge is compressed every 5 messages via a hidden LLM call. The results go to localStorage, not the chat.
**Fix:** `knowledgeService` operates silently. The system prompt is augmented with known context — the companion naturally remembers without ever mentioning it has notes.
**Rule:** Memory should feel magical, not creepy. The companion just "knows" — never reveals the mechanism.

### isInitializing Prevents Race Conditions on First Load

**Context:** Without `isInitializing`, the sidebar was enabled before the session was ready. Users could switch companions mid-initialization.
**What happened:** Rapid companion clicks during init caused multiple concurrent session creations and orphaned async flows.
**Fix:** `isInitializing: true` at start of `selectCompanion`, set to `false` only after session is created (or fails).
**Rule:** Gate all interactive controls behind a single `isBusy` flag. Users can't break what they can't click.

### Challenge Cache Prevents Redundant API Calls

**Context:** The same theme combination (e.g., "lemonade+penguin+economy") would trigger a new LLM call every time.
**What happened:** Cache key uses sorted themes so `['a','b','c']` and `['c','a','b']` hit the same entry. Max 200 items with LRU pruning.
**Fix:** `getCachedChallenge()` checks before LLM call. `cacheChallenge()` stores with timestamp. Prune oldest on overflow.
**Rule:** Cache expensive LLM calls. Same input = same output. Sort inputs for cache key stability.

---

## 2026-04-10 — Streaming Fix + Companion Expansion

### Streaming Text Caused Flashing/Re-rendering Every Word
**Context:** Every streaming chunk called `createMessageObj(chunk)` which re-ran `marked.parse()` + `DOMPurify.sanitize()` on the FULL cumulative text.
**What happened:** The entire HTML was replaced on every word -- causing visible flickering, layout shifts, and wasted CPU on markdown parsing 50+ times per second.
**Fix:** During streaming, update only `message.text` (no markdown). Show plain text with blinking cursor. After stream completes, call `finalizeMessage()` which renders markdown ONCE.
**Rule:** Never re-parse/re-render during a tight streaming loop. Update raw state during streaming, render once at the end.

### Chrome promptStreaming Returns Cumulative Text
**Context:** Chrome's `session.promptStreaming()` returns the FULL response so far on each chunk -- not just the new tokens.
**What happened:** Both Chrome and Ollama yield cumulative text. Each chunk replaces the previous display, not appended to it.
**Fix:** `updateMessageText()` sets `text` directly. No concatenation needed. After stream: `finalizeMessage()` renders markdown once.
**Rule:** Always verify chunk behavior per provider. Both Chrome and Ollama return cumulative full text in each chunk.

### 10 Companions with Unique Personalities
**Context:** Started with 5 companions. Users want genuine variety in expertise areas and teaching styles.
**What happened:** Added Atlas (career strategy), Luna (writing/storytelling), Zen (coding), Hera (leadership) -- each with unique personality, mood, charisma, goals, and teaching style.
**Fix:** Each companion has: id, name, shortName, tagline, emoji, color, colorBg, gradient, detailed system prompt, category, voiceStyle.
**Rule:** Companions must feel genuinely different -- not just reskinned versions of the same AI. Different expertise, different teaching style, different personality.

---
