# Architecture

## Overview

LexiChat is a client-side-only React application. All AI inference runs locally — either via Chrome's built-in Gemini Nano or a local Ollama instance. No data leaves the user's machine.

## Tech Stack

| Layer       | Technology                 | Why                                    |
| ----------- | -------------------------- | -------------------------------------- |
| Framework   | React 19                   | Ecosystem, hooks, dev tools            |
| State       | Zustand 4.5.7              | Zero boilerplate, devtools, middleware |
| Build       | Vite 5                     | Fast HMR, native ESM, SCSS support     |
| Styling     | Tailwind CSS 3 + SCSS      | Utility-first + custom design tokens   |
| AI (Chrome) | `LanguageModel` Prompt API | Standardized, on-device, no API key    |
| AI (Ollama) | REST `/api/chat` streaming | Local models, full control             |
| Markdown    | marked + DOMPurify         | Rendering + XSS sanitization           |
| Lint        | ESLint 9 (flat config)     | Rules, React hooks validation          |
| Format      | Prettier 3                 | Consistent code style                  |
| Tests       | Jest + Testing Library     | Unit/component tests                   |
| E2E         | Playwright                 | Cross-browser end-to-end               |

## AI Client Architecture

Both providers implement the same `AIClient` interface:

```
AIClient (abstract)
├── ChromePromptClient    ← LanguageModel.create()
└── OllamaClient          ← POST /api/chat
```

Each returns a `ClientSession` with identical methods:

- `prompt(text)` → `Promise<string>`
- `promptStreaming(text)` → `AsyncIterable<string>`
- `destroy()` → `void`
- `contextUsage` / `contextWindow` → `number`

This means the **chat store and UI components never know which provider is active**. The store calls `createSession()` and `promptStreaming()` — the client handles the rest.

## State Management (Zustand)

Single store in `src/lib/state/useStore.js`:

```
┌─────────────────────────────────────┐
│              useStore                │
├─────────────────────────────────────┤
│ provider: 'chrome' | 'ollama'       │
│ session: ClientSession | null       │
│ selectedAssistantId: string         │
│ messages: Message[]                 │
│ textInputValue: string              │
│ isProcessing: boolean               │
│ runtimeError: string | null         │
│ isSpeaking: boolean                 │
│ ollamaModels: Model[]               │
│ ...actions                          │
└─────────────────────────────────────┘
```

Actions are embedded in the store (no thunks/middleware needed for this scale).

## Component Tree

```
App
├── Sidebar
│   ├── CompanionRadioGroup
│   └── ProviderSelector
├── MainChat
│   ├── Header
│   ├── RuntimeErrorBanner
│   ├── ChatArea (aria-live)
│   │   ├── EmptyState
│   │   └── ChatMessage[] ×
│   │       ├── MessageActions
│   │       └── formattedText (dangerouslySetInnerHTML)
│   └── ChatInput
```

## Data Flow

```
User types → Enter key / Send button
  → store.sendMessage(text)
    → store messages.push(userMsg)
    → client.promptStreaming(userText)
      → for each chunk: update last message
    → store messages[last] = final response
```

## Security

- **XSS:** All markdown rendered through DOMPurify before `dangerouslySetInnerHTML`
- **CSP:** No inline scripts (except Vite dev), external fonts via preconnect
- **Input validation:** Max 4000 characters per message
- **No external APIs:** Everything runs locally

## Performance

- `React.memo` on leaf components (ChatMessage, MessageActions)
- Zustand selective subscriptions (components only subscribe to slices they need)
- Streaming updates use functional `setMessages(prev => ...)` to avoid stale state
- Speech synthesis cleanup on unmount
