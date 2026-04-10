# Qwen Code Agent Rules — LexiChat Project

> Auto-maintained. Last updated: 2026-04-10

## Project Identity

- **Name:** LexiChat (formerly Nano Chat)
- **Purpose:** Personal-development chat app with 5 AI companions
- **Tagline:** "Your AI growth companion"

## Tech Stack (Do NOT Change Without Asking)

| Layer                | Tool                                         |
| -------------------- | -------------------------------------------- |
| Framework            | React 19                                     |
| State                | Zustand 4.5.7                                |
| Build                | Vite 7.3.2                                   |
| Styling              | Tailwind CSS 3 + SCSS                        |
| AI Client            | Unified AIClient interface (Chrome + Ollama) |
| Default Ollama Model | `gemma4:31b-cloud`                           |
| TTS                  | Kokoro-js                                    |
| Markdown             | marked + DOMPurify                           |
| Lint                 | ESLint 9.39.4 (flat config)                  |
| Format               | Prettier 3 + Biome 2.4.11                    |
| Tests                | Jest + Testing Library, Playwright E2E       |

## Code Conventions

- 2 spaces indentation
- Single quotes for strings
- No trailing commas
- 100 character line width
- Semicolons always
- `jsx` extension for React files
- SCSS for styles (not plain CSS)
- Functional components, no class components
- Zustand store in `src/lib/state/useStore.js`
- AI clients in `src/lib/ai/`
- Each component in its own file under `src/lib/components/`

## AI Client Architecture

- Both Chrome and Ollama implement the same `AIClient` interface
- Components must NEVER know which provider is active
- Store calls `createSession()` and `promptStreaming()` — clients handle the rest
- System prompt passed via `initialPrompts` for Chrome, as first message for Ollama

## Security Rules

- DOMPurify MUST sanitize all markdown before `dangerouslySetInnerHTML`
- No `eval()`, no `new Function()`
- No external API calls except Ollama `localhost:11434`
- Max input length: 4000 characters
- No secrets/keys in code

## Documentation Rules

- Every finished task → move `docs/tasks/X.md` → `docs/archived/tasks/X.md`
- Update README.md if user-facing changes
- Update ARCHITECTURE.md if structural changes
- Update this file if conventions change
- Commit after each phase with descriptive message

## Quality Gates (Must Pass Before Committing)

```bash
npm run lint      # ESLint + Prettier check
npm run test      # Jest unit tests
npm run build     # Vite production build
```

## Companion Personas

| ID    | Name                 | Emoji | Specialty                      |
| ----- | -------------------- | ----- | ------------------------------ |
| Aria  | IELTS Aria           | 🎓    | C2 English mastery             |
| Kai   | Mindful Kai          | 🧘    | Mindfulness & emotional growth |
| Nova  | Fitness Nova         | ⚡    | Body & energy coaching         |
| Sage  | Sage the Philosopher | 🔮    | Critical thinking & wisdom     |
| Pixel | Creative Pixel       | 🎨    | Design & creative skills       |

## What NOT To Do

- Do NOT use class components
- Do NOT use Redux, Context API for state (use Zustand)
- Do NOT use plain CSS (use SCSS)
- Do NOT add server-side code
- Do NOT use external AI APIs (only Chrome LanguageModel + Ollama)
- Do NOT remove ESLint or Prettier
- Do NOT commit without passing `npm run lint && npm run test && npm run build`
- Do NOT translate or localize — app is English-only
- Do NOT use `window.ai.languageModel` — use `LanguageModel` global directly
