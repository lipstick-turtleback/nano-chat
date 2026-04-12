# LexiChat — Complete Rebuild Plan

> **Project:** Nano Chat → LexiChat
> **Date:** April 10, 2026
> **Status:** Planned, awaiting implementation

---

## Overview

Complete rebuild of the chat application with:

- Zustand 4.5.7 for state management
- Unified AI client architecture (Chrome + Ollama, interchangeable)
- Personal-development companions (5 personas, each focused on a growth area)
- SCSS + Tailwind CSS for styling
- ESLint + Prettier restored alongside Biome
- Radio controls for companion + provider selection
- Polished UI/UX with animations and accessibility
- Quality gates: lint, unit tests, type checks

---

## Phase 1: Foundation & Infrastructure

### 1.1 Dependencies

- ✅ Zustand 4.5.7 (installed)
- ✅ SCSS/sass (installed)
- ✅ ESLint + plugins + Prettier (reinstalled)
- Keep: React 19, Vite 5, marked, DOMPurify, Tailwind CSS
- Keep: Biome (for fast formatting alongside ESLint)

### 1.2 Config Files

| File                   | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `eslint.config.js`     | ESLint flat config with React + React Hooks rules  |
| `.prettierrc`          | Prettier: 2-space, single quotes, tab-width 2      |
| `.prettierignore`      | Ignore dist/, node_modules/, coverage/             |
| `biome.json`           | Keep for fast formatting, defer to ESLint for lint |
| `tailwind.config.js`   | Update content glob for jsx, scss                  |
| `postcss.config.js`    | Keep as-is                                         |
| `vite.config.js`       | React plugin, SCSS auto-handled by Vite            |
| `jest.config.js`       | jsdom, babel-jest, setupTests                      |
| `babel.config.json`    | @babel/preset-env + @babel/preset-react            |
| `playwright.config.js` | Chromium, Firefox, Webkit                          |

### 1.3 Scripts in package.json

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "format": "prettier --write .",
  "lint": "eslint . && biome format --check .",
  "lint:fix": "eslint --fix . && biome format --write .",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "check": "npm run lint && npm run test -- --coverage"
}
```

### 1.4 Directory Structure

```
src/
  main.jsx
  App.jsx
  styles/
    _variables.scss
    _mixins.scss
    _reset.scss
    _animations.scss
    _components.scss
    app.scss              ← main import
  lib/
    ai/
      AIClient.js           ← abstract interface
      ChromePromptClient.js ← Chrome LanguageModel impl
      OllamaClient.js       ← Ollama REST impl
    state/
      useStore.js           ← Zustand store
    components/
      Sidebar.jsx
      ChatArea.jsx
      ChatMessage.jsx
      MessageActions.jsx
      ChatInput.jsx
      Header.jsx
      ErrorScreen.jsx
      EmptyState.jsx
      ProviderSelector.jsx
      CompanionCard.jsx
      RuntimeErrorBanner.jsx
    utils/
      constants.js
      markdown.js
      id.js                   ← message ID generator
    services/
  test/
    setup.js
    mocks/
  __tests__/
    components/
    state/
    utils/
    ai/
e2e/
  app.spec.js
```

---

## Phase 2: AI Client Architecture

### 2.1 AIClient Interface (`src/lib/ai/AIClient.js`)

Abstract contract both clients implement:

```typescript
interface ClientSession {
  prompt(text: string, opts?: { signal; model }): Promise<string>;
  promptStreaming(text: string, opts?: { signal; model }): AsyncIterable<string>;
  destroy(): void;
  contextUsage: number;
  contextWindow: number;
}

interface ClientOptions {
  systemPrompt?: string;
  onProgress?(pct: number): void;
  model?: string; // Ollama model name
}

abstract class AIClient {
  static providerName: string;
  static availability(): Promise<'unavailable' | 'downloading' | 'available'>;
  static createSession(opts?: ClientOptions): Promise<ClientSession>;
  static listModels?(): Promise<Array<{ name; label }>>;
}
```

### 2.2 ChromePromptClient (`src/lib/ai/ChromePromptClient.js`)

- Uses `LanguageModel.create()` (standard Prompt API)
- System prompt via `initialPrompts[{role: 'system', ...}]`
- Monitor for download progress
- Wraps session in `ClientSession` interface

### 2.3 OllamaClient (`src/lib/ai/OllamaClient.js`)

- `POST /api/chat` streaming
- System prompt as `{role: 'system', content}` in messages array
- `GET /api/tags` for model listing
- Wraps in same `ClientSession` interface
- AbortController support

---

## Phase 3: Zustand Store

### 3.1 Store Shape (`src/lib/state/useStore.js`)

```javascript
const useStore = create((set, get) => ({
  // Provider
  provider: 'chrome',        // 'chrome' | 'ollama'
  session: null,             // ClientSession instance
  ollamaModels: [],
  selectedOllamaModel: '',
  ollamaConnected: false,
  modelDownloadProgress: null,

  // Companion
  selectedAssistantId: 'Aria',

  // Chat
  messages: [],              // { id, src, text, formattedText, timestamp }

  // UI
  textInputValue: '',
  isProcessing: false,
  showNoAiError: false,
  runtimeError: null,

  // TTS
  isSpeaking: false,

  // Actions
  init: async () => {...},
  switchProvider: async (p) => {...},
  selectCompanion: async (id) => {...},
  sendMessage: async (text) => {...},
  cancelRequest: () => {...},
  setTextInputValue: (v) => set({ textInputValue: v }),
  dismissError: () => set({ runtimeError: null }),
  exportChat: () => {...},
  copyMessage: async (text) => {...},
  speakMessage: async (text, voiceStyle) => {...},
  stopSpeaking: () => {...},
  refreshOllamaModels: async () => {...},
  setSelectedOllamaModel: (m) => set({ selectedOllamaModel: m }),
}));
```

### 3.2 Key Behaviors

- `init()`: Check provider availability, create session, trigger greeting
- `sendMessage(text)`: Push user message, stream AI response
- `switchProvider(p)`: Destroy old session, create new one, reset chat
- `selectCompanion(id)`: Reset chat, re-init with new system prompt

---


### 4.1 Service (`src/lib/services/ttsService.js`)

```javascript

let ttsInstance = null;

export async function initTTS(onProgress) {
  await ttsInstance.load();
  return ttsInstance;
}

export async function speak(text, voiceStyle = 'default') {
  if (!ttsInstance) await initTTS();
  return ttsInstance.generate(text, { voice: voiceStyle });
}

export function stopSpeaking() {
  ttsInstance?.stop();
}
```

### 4.2 Voice Style Mapping

| Companion         | Voice Style                      |
| ----------------- | -------------------------------- |
| Aria (IELTS)      | `default` (clear, educational)   |
| Kai (Mindful)     | `soft` (calm, gentle)            |
| Nova (Fitness)    | `energetic` (upbeat, motivating) |
| Sage (Philosophy) | `measured` (thoughtful, paced)   |
| Pixel (Creative)  | `upbeat` (bright, creative)      |

---

## Phase 5: Components (with Tailwind + SCSS + Radio Controls)

### 5.1 Layout

- **Sidebar**: Radio group for companions (cards with emoji, name, tagline, color accent)
- **Main area**: Header → Runtime error banner (if any) → Chat area → Input bar
- **Header**: Provider radio selector (Chrome AI / Ollama), model dropdown for Ollama, status indicator

### 5.2 Companion Selection — Radio Cards

```jsx
<fieldset className="companion-radio-group">
  {companions.map((c) => (
    <label key={c.id} className={`companion-radio-card ${active ? 'active' : ''}`}>
      <input
        type="radio"
        name="companion"
        value={c.id}
        checked={c.id === selectedId}
        onChange={() => onSelect(c.id)}
      />
      <span className="companion-emoji" aria-hidden="true">
        {c.emoji}
      </span>
      <div>
        <span className="name">{c.shortName}</span>
        <span className="tagline">{c.tagline}</span>
      </div>
    </label>
  ))}
</fieldset>
```

### 5.3 Provider Selection — Radio Pills

```jsx
<fieldset className="provider-radio">
  <label>
    <input type="radio" name="provider" value="chrome" checked={...} />
    <span>🧠 Chrome AI</span>
  </label>
  <label>
    <input type="radio" name="provider" value="ollama" checked={...} />
    <span>🦙 Ollama</span>
    {statusDot}
  </label>
</fieldset>
```

### 5.4 Chat Messages

- User: right-aligned, gradient bubble, white text
- Assistant: left-aligned, white bubble with colored left border
- Avatar emoji + name header on assistant messages
- Hover-reveal actions (copy, speak)
- `aria-live="polite"` on chat container

### 5.5 Empty State

- Large companion emoji
- "Start a conversation with {name}"
- Suggested first prompts

### 5.6 Chat Input

- Textarea with auto-resize
- Character count
- Send button (arrow icon) / Cancel button (square icon while processing)
- Enter to send, Shift+Enter for newline

---

## Phase 6: SCSS Architecture

### 6.1 Variables (`_variables.scss`)

```scss
:root {
  --accent: #7c3aed;
  --accent-bg: #f5f3ff;
  --gradient: linear-gradient(135deg, #7c3aed, #a78bfa);
  --sidebar-width: 280px;
  --header-height: 56px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: ...;
  --ease-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --ease-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 6.2 Mixins (`_mixins.scss`)

```scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
@mixin sr-only {
  /* accessible hide */
}
@mixin respond-to($breakpoint) {
  /* media query */
}
```

### 6.3 Animations (`_animations.scss`)

```scss
@keyframes slide-up { ... }
@keyframes fade-in { ... }
@keyframes pulse-glow { ... }
@keyframes typing-dot { ... }
```

---

## Phase 7: Tests

### 7.1 Unit Tests

| Test File                    | Coverage                                              |
| ---------------------------- | ----------------------------------------------------- |
| `AIClient.test.js`           | Interface contract validation                         |
| `ChromePromptClient.test.js` | Availability, session creation, mocking LanguageModel |
| `OllamaClient.test.js`       | Availability, streaming, error handling               |
| `useStore.test.js`           | State transitions, sendMessage flow                   |
| `markdown.test.js`           | Rendering, XSS sanitization                           |
| `ttsService.test.js`         | Init, speak, stop                                     |
| `ChatMessage.test.jsx`       | Render variants (user/assistant/error)                |
| `ErrorScreen.test.jsx`       | Content, links                                        |

### 7.2 E2E Tests (Playwright)

| Test              | Description                           |
| ----------------- | ------------------------------------- |
| App loads         | Sidebar + chat area visible           |
| Companions listed | All 5 companions visible              |
| Switch companion  | Chat resets, new greeting appears     |
| Send message      | User bubble appears, response streams |
| Provider section  | Chrome + Ollama radios visible        |
| Copy message      | Clipboard works                       |
| Export chat       | File downloads                        |

---

## Phase 8: Quality Gates

### 8.1 ESLint Rules

- `react-hooks/exhaustive-deps`: error
- `no-unused-vars`: warn
- `no-console`: warn (allow error)
- `react/prop-types`: off (using JS)
- `react/no-unescaped-entities`: warn

### 8.2 Prettier Rules

- 2 spaces, single quotes, no trailing commas, 100 line width
- Tailwind plugin for class sorting

### 8.3 Biome

- Keep for fast formatting check in CI
- ESLint handles linting rules

### 8.4 npm run check

Runs: `lint → test --coverage`

- Fails if lint errors
- Fails if any test fails
- Fails if coverage below threshold

---

## Implementation Order

```
Phase 1 (Infrastructure) → Phase 2 (AI Clients) → Phase 3 (Zustand Store)
     ↓                           ↓                          ↓
     ↓                      ↓                     ↓
Phase 7 (Tests) → Phase 8 (Quality Gates) → Final Build
```

---

## Success Criteria

| Metric             | Target                                           |
| ------------------ | ------------------------------------------------ |
| `npm run lint`     | 0 errors, 0 warnings                             |
| `npm run test`     | All tests pass, >70% coverage                    |
| `npm run build`    | No errors, bundle < 300kb gzipped                |
| `npm run test:e2e` | All 7 E2E tests pass                             |
| Accessibility      | No axe-core violations                           |
| XSS                | DOMPurify sanitizes all markdown                 |
| Interchangeable AI | Swap Chrome ↔ Ollama with zero component changes |
