# LexiChat

> **Your AI growth companion.** Five unique mentors. Infinite potential.

LexiChat is a beautiful, locally-run personal development app with five AI companions — each specializing in a different area of growth. Choose your mentor, pick your AI engine, and start evolving.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Zustand-4.5-e47138?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Type-TypeScript-blue?style=for-the-badge" alt="Typed" />
</p>

---

## ✨ Features

| Feature                 | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| **5 AI Companions**     | Each with a unique personality, expertise, and teaching style                     |
| **Interactive Quizzes** | Multiple-choice, fill-in-blanks, true/false, word matching — all rendered in-chat |
| **Creative Challenges** | Three random themes combined into surprising learning activities                  |
| **Smart Memory**        | Each companion silently learns about you and personalizes future sessions         |
| **Challenge Cache**     | Generated quizzes are stored locally — instant replay, zero API calls             |
| **Dual AI Engines**     | Chrome Gemini Nano (on-device) or local Ollama models                             |
| **Client-Side TTS**     | Natural speech via Kokoro-js, with per-companion voice styles                     |
| **Progress Tracking**   | Sessions, streaks, achievements, and skill growth                                 |
| **Fully Private**       | No servers, no API keys, no data leaves your machine                              |

---

## 🎭 Meet Your Companions

| Companion          | Emoji | Specialty                                                  | Vibe                                |
| ------------------ | ----- | ---------------------------------------------------------- | ----------------------------------- |
| **IELTS Aria**     | 🎓    | C2 English mastery, vocabulary games, debate practice      | Warm, witty, encouraging            |
| **Mindful Kai**    | 🧘    | Mindfulness, emotional intelligence, self-awareness        | Calm, gentle, validating            |
| **Fitness Nova**   | ⚡    | Body optimization, workouts, energy management             | Hype, science-backed, fun           |
| **Sage**           | 🔮    | Critical thinking, logic, wisdom, decision-making          | Thoughtful, curious, playful        |
| **Creative Pixel** | 🎨    | Design thinking, visual literacy, creative problem-solving | Enthusiastic, structured, inspiring |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Chrome 131+** with Gemini Nano _(optional, for Chrome AI provider)_
- **Ollama** running locally _(optional, for Ollama provider)_

### Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Using Ollama

```bash
# Install Ollama: https://ollama.com
ollama pull gemma4:31b-cloud
ollama serve
```

Then switch the provider in the sidebar.

---

## 📦 Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start dev server (Vite)         |
| `npm run build`         | Production build                |
| `npm run preview`       | Preview production build        |
| `npm run lint`          | ESLint check                    |
| `npm run lint:fix`      | Auto-fix lint issues            |
| `npm run format`        | Prettier format                 |
| `npm run test`          | Jest unit tests                 |
| `npm run test:coverage` | Tests with coverage report      |
| `npm run test:e2e`      | Playwright E2E tests            |
| `npm run check`         | Full quality gate (lint + test) |

---

## 🏗 Architecture

```
src/
├── App.jsx                          # Root — composes all components
├── main.jsx                         # Entry point
├── styles/
│   ├── _variables.scss              # Design tokens (colors, spacing, radii)
│   └── app.scss                     # All component styles
└── lib/
    ├── ai/
    │   ├── AIClient.js              # Abstract interface contract
    │   ├── ChromePromptClient.js    # Chrome LanguageModel implementation
    │   └── OllamaClient.js          # Ollama REST implementation
    ├── state/
    │   └── useStore.js              # Zustand store — all state + actions
    ├── components/
    │   ├── Sidebar.jsx              # Companion cards + provider selector
    │   ├── ChatArea.jsx             # Message list with empty state
    │   ├── ChatMessage.jsx          # Individual message with tool detection
    │   ├── ChatInput.jsx            # Textarea + send/cancel
    │   ├── ChatHeader.jsx           # Status indicator + progress bar
    │   ├── ToolRenderer.jsx         # Interactive quiz/challenge cards
    │   ├── MessageActions.jsx       # Copy + TTS buttons
    │   ├── RuntimeErrorBanner.jsx   # Dismissible error display
    │   ├── ErrorScreen.jsx          # No-AI-provider fallback
    │   └── CompanionCard.jsx        # Single companion radio card
    ├── utils/
    │   ├── constants.js             # Companion definitions + config
    │   ├── markdown.js              # marked + DOMPurify rendering
    │   ├── quizEngine.js            # Challenge generation logic
    │   ├── themeEngine.js           # 100-theme creative challenge system
    │   └── chatTools.js             # Generic tool definitions (quiz, flashcard, etc.)
    ├── services/
    │   ├── ttsService.js            # Kokoro-js TTS (lazy-loaded)
    │   ├── knowledgeService.js      # User knowledge compression + restore
    │   └── challengeCache.js        # localStorage challenge cache
    └── __tests__/                   # Unit tests
        ├── markdown.test.js
        ├── OllamaClient.test.js
        ├── ttsService.test.js
        ├── themeEngine.test.js
        └── challengeCache.test.js
```

### AI Client Contract

Both providers implement the same interface:

```typescript
interface ClientSession {
  prompt(text): Promise<string>;
  promptStreaming(text): AsyncIterable<string>;
  destroy(): void;
  contextUsage: number;
  contextWindow: number;
}
```

Components **never** know which provider is active. The store calls `createSession()` and `promptStreaming()` — clients handle the rest.

### Knowledge System

Each companion maintains a silent memory in `localStorage`:

```json
{
  "Aria": {
    "userProfile": {
      "strengths": ["vocabulary", "grammar"],
      "weaknesses": ["inverted conditionals"],
      "goals": ["IELTS C2"],
      "level": "C1"
    },
    "progress": {
      "sessionsCompleted": 12,
      "streak": 5,
      "lastTopics": ["paraphrasing", "debate"]
    }
  }
}
```

Knowledge is silently compressed every 5 messages via an LLM summarization prompt. It's loaded when you select a companion — no chat message, just natural personalization.

### Challenge Cache

Generated quizzes are cached by `(companion, type, themes)`:

```
Cache key: "Aria:quiz:economy+lemonade+penguin"
→ Stored quiz JSON, never re-generated
→ Max 200 items, LRU pruning
```

---

## 🧪 Testing

```bash
# Unit tests (Jest + Testing Library)
npm run test

# E2E tests (Playwright — Chromium, Firefox, Webkit)
npx playwright install
npm run test:e2e
npm run test:e2e:ui
```

| Test File                | Coverage                                        |
| ------------------------ | ----------------------------------------------- |
| `markdown.test.js`       | Rendering, XSS sanitization, event injection    |
| `OllamaClient.test.js`   | Availability, model listing, provider name      |
| `ttsService.test.js`     | Ready/loading state                             |
| `themeEngine.test.js`    | Random themes, prompt generation, tool types    |
| `challengeCache.test.js` | Caching, retrieval, order-independence, pruning |

---

## 🎨 Design System

- **Theme:** Clean light mode with per-companion accent colors
- **Typography:** Inter (UI) + JetBrains Mono (code)
- **Spacing:** 4px base grid
- **Shadows:** Subtle, 3 levels (xs, sm, md)
- **Animations:** Smooth cubic-bezier transitions on everything
- **Accessibility:** ARIA labels, keyboard navigation, focus indicators, `aria-live` chat region

---

## 📝 License

MIT — see [LICENSE](LICENSE)

---

<p align="center">Built with ❤️ and local AI</p>
