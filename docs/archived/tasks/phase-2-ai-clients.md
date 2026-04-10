# Task: Phase 2 — Unified AI Clients

**Status:** 🔴 Pending
**Created:** 2026-04-10
**Phase:** 2 of 8

## Description

Create the unified AIClient interface with ChromePromptClient and OllamaClient implementations that share the same contract.

## Checklist

- [ ] Create `src/lib/ai/AIClient.js` — abstract interface
- [ ] Create `src/lib/ai/ChromePromptClient.js` — LanguageModel API
- [ ] Create `src/lib/ai/OllamaClient.js` — Ollama REST with `gemma4:31b-cloud` default
- [ ] Both return identical `ClientSession` objects
- [ ] Write unit tests for both clients
- [ ] Remove old `aiService.js` and `ollamaService.js`

## Acceptance Criteria

- Swapping provider requires zero component changes
- Both support `prompt()`, `promptStreaming()`, `destroy()`
- Chrome: uses `LanguageModel.create()` with `initialPrompts` for system prompt
- Ollama: uses `/api/chat` with system message in messages array
- Default Ollama model: `gemma4:31b-cloud`
