# Node.js Backend — Complete Implementation Plan

> Created: 2026-04-10
> Status: Phase A ready for implementation

---

## Architecture Overview

```
Browser (Vite, port 5173)
    ↓ fetch('/api/*')
Express Server (port 3001)
    ↓
├── Ollama Proxy → localhost:11434 (or env OLLAMA_URL)
├── TTS Engine → Kokoro-js (server-side, cached)
├── Game Engine → DnD, dice, challenges
├── Knowledge Extractor → LLM background jobs
├── SQLite → player data, sessions, cache
└── File Cache → TTS audio, generated content
```

## Directory Structure

```
server/
├── index.js                 # Express app, middleware, routes
├── db.js                    # SQLite connection + schema init
├── .env                     # Local config (gitignored)
├── .env.example             # Template
├── routes/
│   ├── ollama.js            # Ollama proxy routes
│   ├── tts.js               # TTS generation + cache
│   ├── games.js             # DnD, dice, challenges
│   ├── knowledge.js         # Knowledge store CRUD
│   ├── sessions.js          # Chat session management
│   └── health.js            # Health check
├── models/
│   ├── Player.js            # Player queries
│   ├── Session.js           # Chat session queries
│   ├── Knowledge.js         # Knowledge store queries
│   ├── Game.js              # DnD/game queries
│   └── Cache.js             # TTS/file cache queries
├── services/
│   ├── ollamaService.js     # Ollama HTTP client + streaming
│   ├── ttsService.js        # Kokoro-js wrapper + audio cache
│   ├── diceService.js       # Dice rolling (crypto random)
│   ├── knowledgeExtractor.js# LLM-based knowledge extraction
│   └── cacheService.js      # File-based cache for TTS audio
└── middleware/
    ├── error.js             # Global error handler
    └── validate.js          # Request validation
```

---

## Phase A: Server Foundation

### A.1 Dependencies

```json
{
  "express": "^4.21.0",
  "dotenv": "^16.4.5",
  "cors": "^2.8.5",
  "better-sqlite3": "^11.3.0",
  "cookie-parser": "^1.4.6",
  "concurrently": "^9.0.0",
  "nodemon": "^3.1.4"
}
```

### A.2 `.env.example`

```env
# Server
PORT=3001
NODE_ENV=development

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma4:31b-cloud

# Database
DB_PATH=./server/data/lexichat.db

# TTS
TTS_CACHE_DIR=./server/data/tts_cache
TTS_CACHE_MAX_AGE_HOURS=72

# Knowledge Extraction
KNOWLEDGE_EXTRACT_INTERVAL_MESSAGES=10
```

### A.3 `server/.env` (local, gitignored)

```env
PORT=3001
NODE_ENV=development
OLLAMA_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma4:31b-cloud
DB_PATH=./server/data/lexichat.db
TTS_CACHE_DIR=./server/data/tts_cache
KNOWLEDGE_EXTRACT_INTERVAL_MESSAGES=10
```

### A.4 `server/db.js` — SQLite Setup

```javascript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'lexichat.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    -- Players
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY DEFAULT 'default',
      display_name TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat Sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      messages TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      knowledge_extracted BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    -- Knowledge Store (per player + companion)
    CREATE TABLE IF NOT EXISTS knowledge_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, companion_id, key)
    );

    -- Companion Progress
    CREATE TABLE IF NOT EXISTS companion_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      sessions_completed INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      level TEXT DEFAULT 'beginner',
      data TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, companion_id)
    );

    -- DnD Campaigns
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DnD Characters
    CREATE TABLE IF NOT EXISTS dnd_characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      ac INTEGER NOT NULL,
      stats TEXT NOT NULL,
      inventory TEXT NOT NULL,
      abilities TEXT NOT NULL,
      backstory TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DnD Session Log (scene-by-scene)
    CREATE TABLE IF NOT EXISTS dnd_scene_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      character_id INTEGER REFERENCES dnd_characters(id),
      scene_number INTEGER DEFAULT 1,
      narrative TEXT NOT NULL,
      player_action TEXT NOT NULL,
      action_type TEXT,
      roll_notation TEXT,
      roll_result INTEGER,
      dc INTEGER,
      outcome TEXT,
      state_snapshot TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TTS Cache
    CREATE TABLE IF NOT EXISTS tts_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text_hash TEXT NOT NULL UNIQUE,
      voice TEXT NOT NULL,
      file_path TEXT NOT NULL,
      text_preview TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game Sessions
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL DEFAULT 'default',
      companion_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default player if not exists
    INSERT OR IGNORE INTO players (id) VALUES ('default');
  `);
}

export default db;
```

### A.5 `server/index.js` — Express App

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initSchema } from './db.js';
import { errorHandler } from './middleware/error.js';
import ollamaRoutes from './routes/ollama.js';
import ttsRoutes from './routes/tts.js';
import gameRoutes from './routes/games.js';
import knowledgeRoutes from './routes/knowledge.js';
import sessionRoutes from './routes/sessions.js';
import healthRoutes from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database
initSchema();
console.log('✅ Database initialized');

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/sessions', sessionRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LexiChat server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🦙 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
});

export default app;
```

### A.6 `server/middleware/error.js`

```javascript
export function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      status
    }
  });
}
```

### A.7 Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "nodemon --watch server/ --exec node server/index.js",
    "client:dev": "vite",
    "build": "vite build",
    "server:start": "node server/index.js",
    "preview": "vite preview"
  }
}
```

---

## Phase B: Ollama Proxy

### B.1 `server/services/ollamaService.js`

```javascript
import { Readable } from 'stream';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export async function checkConnection() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels() {
  const res = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.models || []).map((m) => ({
    name: m.name,
    size: m.size,
    digest: m.digest,
    modifiedAt: m.modified_at,
    label: m.name.split(':')[0]
  }));
}

/**
 * Stream chat response via Server-Sent Events
 */
export async function streamChat(req, res) {
  const { model, messages, systemPrompt, options = {} } = req.body;

  const ollamaMessages = [];
  if (systemPrompt) {
    ollamaMessages.push({ role: 'system', content: systemPrompt });
  }
  ollamaMessages.push(...messages);

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || process.env.OLLAMA_DEFAULT_MODEL,
      messages: ollamaMessages,
      stream: true,
      ...options
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    return res.status(response.status).json({ error: errText });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const content = json.message?.content || '';
          fullResponse += content;
          res.write(
            `data: ${JSON.stringify({ content, full: fullResponse, done: json.done })}\n\n`
          );
        } catch {
          // Skip malformed
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
```

### B.2 `server/routes/ollama.js`

```javascript
import { Router } from 'express';
import * as ollama from '../services/ollamaService.js';

const router = Router();

router.get('/status', async (req, res) => {
  const connected = await ollama.checkConnection();
  res.json({ connected, url: process.env.OLLAMA_URL });
});

router.get('/models', async (req, res) => {
  const models = await ollama.listModels();
  res.json(models);
});

router.post('/chat', (req, res) => {
  ollama.streamChat(req, res);
});

export default router;
```

---

## Phase C: TTS Server

### C.1 `server/services/ttsService.js`

```javascript
import { KokoroTTS } from 'kokoro-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = process.env.TTS_CACHE_DIR || './server/data/tts_cache';
const VOICE_MAP = {
  cheerful: 'af_heart',
  soft: 'af_sky',
  energetic: 'am_puck',
  measured: 'am_adam',
  upbeat: 'af_bella',
  default: 'af_heart'
};

let ttsInstance = null;

export async function getTTS() {
  if (!ttsInstance) {
    ttsInstance = new KokoroTTS();
    await ttsInstance.load();
  }
  return ttsInstance;
}

export function getVoice(style) {
  return VOICE_MAP[style] || VOICE_MAP.default;
}

export function hashText(text, voice) {
  return crypto.createHash('md5').update(`${voice}:${text}`).digest('hex');
}

export function getCachedPath(hash) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return path.join(CACHE_DIR, `${hash}.wav`);
}

export async function generateSpeech(text, voiceStyle = 'default') {
  const voice = getVoice(voiceStyle);
  const hash = hashText(text, voice);
  const cachedPath = getCachedPath(hash);

  // Return cached audio if exists
  if (fs.existsSync(cachedPath)) {
    return { path: cachedPath, cached: true };
  }

  const tts = await getTTS();
  const audio = await tts.generate(text, { voice });

  // Save to cache
  const buffer = Buffer.from(await audio.arrayBuffer());
  fs.writeFileSync(cachedPath, buffer);

  return { path: cachedPath, cached: false };
}

export function listVoices() {
  return [
    { id: 'af_heart', name: 'Heart (warm, female)', style: 'cheerful' },
    { id: 'af_sky', name: 'Sky (calm, female)', style: 'soft' },
    { id: 'am_puck', name: 'Puck (energetic, male)', style: 'energetic' },
    { id: 'am_adam', name: 'Adam (measured, male)', style: 'measured' },
    { id: 'af_bella', name: 'Bella (bright, female)', style: 'upbeat' },
    { id: 'af_alloy', name: 'Alloy', style: 'default' },
    { id: 'af_nicole', name: 'Nicole', style: 'default' },
    { id: 'am_michael', name: 'Michael', style: 'default' }
  ];
}
```

### C.2 `server/routes/tts.js`

```javascript
import { Router } from 'express';
import fs from 'fs';
import * as tts from '../services/ttsService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { text, voiceStyle = 'default' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const { path: audioPath, cached } = await tts.generateSpeech(text, voiceStyle);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-Cached', cached ? 'true' : 'false');
    res.sendFile(audioPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/voices', (req, res) => {
  res.json(tts.listVoices());
});

export default router;
```

---

## Phase D: Knowledge Extraction

### D.1 `server/services/knowledgeExtractor.js`

```javascript
import db from '../db.js';

const EXTRACTION_PROMPT = `Analyze the following chat conversation and extract important information about the user.

CHAT LOG:
{messages}

Respond with ONLY valid JSON:
{
  "interests": ["topic1"],
  "strengths": ["skill"],
  "weaknesses": ["area"],
  "goals": ["goal"],
  "achievements": ["accomplishment"],
  "preferences": {
    "learningStyle": "visual",
    "pace": "moderate",
    "topicsEnjoyed": [],
    "topicsAvoided": []
  },
  "personality": {
    "tone": "casual",
    "confidence": "moderate",
    "humor": true
  },
  "progress": {
    "improvements": [],
    "recurringMistakes": [],
    "breakthroughs": []
  },
  "nextSteps": []
}

Be specific. Use examples. Only include confident information.`;

export async function extractKnowledge(playerId, companionId, messages) {
  if (messages.length < 10) return null;

  const text = messages
    .slice(-50)
    .map((m) => `[${m.src}] ${m.text}`)
    .join('\n');
  const prompt = EXTRACTION_PROMPT.replace('{messages}', text);

  // Call Ollama to extract knowledge
  const response = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });

  if (!response.ok) return null;

  const data = await response.json();
  try {
    const knowledge = JSON.parse(data.message.content);

    // Merge with existing knowledge
    const existing = getKnowledge(playerId, companionId);
    const merged = mergeKnowledge(existing, knowledge);

    // Save to database
    saveKnowledge(playerId, companionId, merged);

    return merged;
  } catch {
    return null;
  }
}

function mergeKnowledge(existing, newKnowledge) {
  return {
    interests: [
      ...new Set([...(existing.interests || []), ...(newKnowledge.interests || [])])
    ].slice(-20),
    strengths: [...new Set([...(existing.strengths || []), ...(newKnowledge.strengths || [])])],
    weaknesses: [...new Set([...(existing.weaknesses || []), ...(newKnowledge.weaknesses || [])])],
    goals: [...new Set([...(existing.goals || []), ...(newKnowledge.goals || [])])],
    achievements: [
      ...new Set([...(existing.achievements || []), ...(newKnowledge.achievements || [])])
    ],
    preferences: {
      ...existing.preferences,
      ...newKnowledge.preferences,
      topicsEnjoyed: [
        ...new Set([
          ...(existing.preferences?.topicsEnjoyed || []),
          ...(newKnowledge.preferences?.topicsEnjoyed || [])
        ])
      ].slice(-10),
      topicsAvoided: [
        ...new Set([
          ...(existing.preferences?.topicsAvoided || []),
          ...(newKnowledge.preferences?.topicsAvoided || [])
        ])
      ].slice(-10)
    },
    progress: {
      improvements: [
        ...new Set([
          ...(existing.progress?.improvements || []),
          ...(newKnowledge.progress?.improvements || [])
        ])
      ].slice(-10),
      recurringMistakes: [
        ...new Set([
          ...(existing.progress?.recurringMistakes || []),
          ...(newKnowledge.progress?.recurringMistakes || [])
        ])
      ],
      breakthroughs: [
        ...new Set([
          ...(existing.progress?.breakthroughs || []),
          ...(newKnowledge.progress?.breakthroughs || [])
        ])
      ].slice(-10)
    },
    nextSteps: newKnowledge.nextSteps || existing.nextSteps || []
  };
}
```

---

## Phase E: Vite Proxy Config

Update `vite.config.js`:

```javascript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

---

## Implementation Order

1. Phase A: Server foundation (db, express, env, scripts) → Test: `curl http://localhost:3001/api/health`
2. Phase B: Ollama proxy → Test: `curl http://localhost:3001/api/ollama/models`
3. Phase C: TTS server → Test: `curl -X POST http://localhost:3001/api/tts/generate -d '{"text":"hello"}'`
4. Phase D: Knowledge extraction → Test: background extraction on chat sessions
5. Phase E: Client integration → Update useStore.js to call /api/\* endpoints
