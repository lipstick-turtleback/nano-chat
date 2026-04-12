# Task: Phase 1 — Foundation & Infrastructure

**Status:** 🟡 In Progress
**Created:** 2026-04-10
**Phase:** 1 of 8

## Description

Set up the project foundation: dependencies, config files, directory structure, and quality gates.

## Checklist

- [x] Install Zustand 4.5.7
- [x] Install SCSS (sass)
- [x] Reinstall ESLint + Prettier + plugins
- [x] Upgrade to Vite 7.3.2 + @vitejs/plugin-react 5
- [ ] Configure ESLint flat config (eslint.config.js)
- [ ] Configure Prettier (.prettierrc, .prettierignore)
- [ ] Update tailwind.config.js for JSX + SCSS
- [ ] Update package.json scripts
- [ ] Create directory structure (styles/, ai/, state/, components/, services/, utils/)
- [ ] Remove all Svelte-era leftover docs
- [ ] Create docs/task files for remaining phases

## Acceptance Criteria

- `npm run lint` passes with zero errors
- `npm run format` formats all files correctly
- Directory structure matches plan
- No Svelte references remain

## Notes

- Biome kept for fast format checking alongside ESLint
- Default Ollama model: `gemma4:31b-cloud`
