# LexiChat

> Your personal AI growth companion — powered by Chrome Gemini Nano & Ollama.

LexiChat is a beautiful, locally-run chat application with **5 personal-development companions**, each specializing in a different area of self-improvement. Choose your AI, pick your provider (Chrome AI or local Ollama), and start growing.

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Zustand](https://img.shields.io/badge/Zustand-4.5.7-e47138)
![Vite](https://img.shields.io/badge/Vite-5-646cff)

---

## ✨ Features

- **5 Personal-Development Companions** — each with a unique personality, teaching style, and gamified learning approach
- **Dual AI Providers** — switch between Chrome Gemini Nano (on-device) and local Ollama models
- **Client-Side TTS** — natural speech via Kokoro-js, with per-companion voice styles
- **Markdown Rendering** — rich formatted responses with XSS-safe sanitization
- **Chat Export** — download conversations as plain text
- **Responsive Design** — works on desktop and mobile
- **Fully Local** — no API keys, no servers, no data leaves your machine

---

## 🎭 Companions

| Companion                | Emoji | Specialty                                                  | Vibe                             |
| ------------------------ | ----- | ---------------------------------------------------------- | -------------------------------- |
| **IELTS Aria**           | 🎓    | C2 English mastery, vocabulary games, debate practice      | Warm, witty, encouraging         |
| **Mindful Kai**          | 🧘    | Mindfulness, emotional intelligence, self-awareness        | Calm, gentle, validating         |
| **Fitness Nova**         | ⚡    | Body optimization, workouts, energy management             | Hype, science-backed, fun        |
| **Sage the Philosopher** | 🔮    | Critical thinking, logic, wisdom, decision-making          | Thoughtful, curious, playful     |
| **Creative Pixel**       | 🎨    | Design thinking, visual literacy, creative problem-solving | Enthusiastic, visual, structured |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Chrome 131+** with Gemini Nano enabled (for Chrome AI provider)
- **Ollama** running locally (optional, for Ollama provider)

### Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Using Ollama

```bash
# Install Ollama: https://ollama.com
ollama pull llama3.2
ollama serve
```

Then switch the provider in the app sidebar.

---

## 📦 Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start dev server (Vite)         |
| `npm run build`         | Production build                |
| `npm run preview`       | Preview production build        |
| `npm run lint`          | ESLint + Biome format check     |
| `npm run lint:fix`      | Auto-fix lint issues + format   |
| `npm run test`          | Run Jest unit tests             |
| `npm run test:watch`    | Watch mode for tests            |
| `npm run test:coverage` | Tests with coverage report      |
| `npm run test:e2e`      | Playwright E2E tests            |
| `npm run check`         | Full quality gate (lint + test) |

---

## 🏗 Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical overview.

**Key decisions:**

- **State:** Zustand 4.5.7 (simple, no boilerplate)
- **AI:** Unified client interface — Chrome and Ollama are interchangeable
- **TTS:** Kokoro-js (client-side, no external APIs)
- **Styling:** Tailwind CSS + SCSS modules
- **Quality:** ESLint (rules) + Prettier (format) + Biome (fast format check)

---

## 📁 Project Structure

```
src/
  main.jsx                    # Entry point
  App.jsx                     # Root component
  styles/                     # SCSS files
  lib/
    ai/                       # Unified AI clients
      AIClient.js               # Abstract interface
      ChromePromptClient.js     # Chrome LanguageModel impl
      OllamaClient.js           # Ollama REST impl
    state/
      useStore.js               # Zustand store
    components/                 # React components
    utils/                      # Helpers, constants
    services/                   # TTS, markdown, etc.
e2e/                          # Playwright tests
docs/                         # Documentation
  tasks/                      # Active task cards
  archived/tasks/             # Completed tasks
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npx playwright install
npm run test:e2e
```

---

## 📝 License

MIT — see [LICENSE](LICENSE)
