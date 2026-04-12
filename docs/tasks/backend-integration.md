# Phase: Node.js Backend Integration

> Created: 2026-04-10
> Status: Planning

## Goal


## Architecture Changes

### Current (Pure Client)

```
Browser → Direct Ollama (localhost:11434)
Browser → localStorage (player stats)
```

### Target (Client + Server)

```
Browser → Express API (localhost:3001)
                    ↓
              Ollama proxy → localhost:11434 (via env config)
                    ↓
                    ↓
              Game engine → DnD, quizzes, challenges
                    ↓
              SQLite → player stats, sessions, cache
```

## Implementation Phases

### Phase A: Server Foundation

- [ ] Create `server/` directory structure
- [ ] Install: express, dotenv, cors, better-sqlite3, cookie-parser
- [ ] Create `server/index.js` — Express app
- [ ] Create `.env` with OLLAMA_URL, PORT, NODE_ENV
- [ ] Create `.env.example` template
- [ ] Add `server/db.js` — SQLite connection
- [ ] Add `server/routes/` — route files
- [ ] Update `vite.config.js` — proxy `/api` to Express
- [ ] Update `package.json` — add `server:dev` script (concurrently)

### Phase B: Ollama Proxy

- [ ] `server/routes/ollama.js` — proxy routes
  - `GET /api/ollama/models` → Ollama `/api/tags`
  - `POST /api/ollama/chat` → Ollama `/api/chat` (streaming)
  - `POST /api/ollama/generate` → Ollama `/api/generate`
  - `GET /api/ollama/status` → health check
- [ ] Configurable OLLAMA_URL via `.env`
- [ ] Streaming support via Server-Sent Events (SSE)
- [ ] Remove direct Ollama calls from client

### Phase C: SQLite Schema

- [ ] Create tables:
  - `players` — id, display_name, created_at, last_active
  - `companion_progress` — player_id, companion_id, sessions, streak, level, data (JSON)
  - `game_sessions` — id, player_id, game_type, state (JSON), created_at
  - `dnd_characters` — id, player_id, name, class, level, stats (JSON), story_data (JSON)
  - `knowledge_store` — player_id, companion_id, key, value, updated_at
  - `chat_sessions` — id, player_id, companion_id, messages (JSON), created_at
- [ ] Create `server/models/` — query helpers
- [ ] Migrate localStorage data to SQLite (optional, client can sync)


- [ ] Audio file caching (avoid regenerating same text)
- [ ] Client fetches audio blob URL instead of generating locally

### Phase E: Game Engine Server

- [ ] `server/routes/games.js`
  - `POST /api/games/challenge` — generate challenge (cached)
  - `POST /api/games/submit` — submit answer, get result
  - `POST /api/games/dnd/character` — create DnD character
  - `POST /api/games/dnd/scene` — generate next scene
  - `POST /api/games/dnd/resolve` — resolve action with dice
  - `POST /api/games/dice/roll` — roll dice (1d6, 2d4, 1d20, etc.)
- [ ] Dice roller with true randomness
- [ ] DnD story state management in SQLite
- [ ] Game session persistence

### Phase F: Knowledge Store Server

- [ ] `server/routes/knowledge.js`
  - `GET /api/knowledge/:playerId/:companionId/:key`
  - `POST /api/knowledge/:playerId/:companionId/:key`
  - `DELETE /api/knowledge/:playerId/:companionId/:key`
  - `GET /api/knowledge/:playerId/:companionId?prefix=`
- [ ] Migrate from localStorage to SQLite
- [ ] Server-side compression trigger (every 5 messages)

### Phase G: Client Updates

- [ ] Update `useStore.js` — call `/api/*` instead of direct calls
- [ ] Update `OllamaClient.js` → calls `/api/ollama/*`
- [ ] Update `playerStats.js` → calls `/api/knowledge/*`
- [ ] Add Game Master companion with dice tools
- [ ] Add dice roll UI component

### Phase H: Dev Experience

- [ ] `concurrently` for running server + Vite
- [ ] `nodemon` for server auto-reload
- [ ] SQLite browser tool (optional)
- [ ] API documentation (OpenAPI/Swagger optional)

## File Structure

```
server/
├── index.js              # Express app entry
├── db.js                 # SQLite connection + schema
├── .env                  # Local config (gitignored)
├── .env.example          # Template
├── routes/
│   ├── ollama.js         # Ollama proxy
│   ├── games.js          # Game engine + DnD
│   ├── knowledge.js      # Key-value store
│   └── health.js         # Health check
├── models/
│   ├── Player.js
│   ├── CompanionProgress.js
│   ├── GameSession.js
│   └── DnDCharacter.js
├── services/
│   ├── ollamaService.js  # Ollama API client
│   ├── diceService.js    # Dice roller
└── middleware/
    └── error.js          # Error handler
```

## Dependencies (New)

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

## Breaking Changes

- Client no longer calls Ollama directly
- localStorage → SQLite migration needed
- Game state moved to server

## Benefits

- **Persistent state** — SQLite survives browser clears
- **Secure Ollama access** — configurable URL, not hardcoded localhost
- **Shared game state** — multiplayer potential
- **Background tasks** — knowledge compression runs on server

## Risks

- Need to run Node.js server (not purely static anymore)
- Need to handle server deployment
- SQLite file needs backup strategy
