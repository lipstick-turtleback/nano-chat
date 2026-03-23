# Code/Architecture Fix Plan - nano-chat

## Overview

This document outlines a phased approach to improving code quality, security, and architecture of the nano-chat application based on analysis from `arch_code_overview.md` and `ISSUES_TO_FIX.md`.

---

## Phase 1: Immediate Security & Quality Fixes (Priority: Critical) ✅ COMPLETE

### 1.1 XSS Vulnerability Mitigation (`src/routes/+page.svelte:237`)

- **Issue:** Using `{@html}` without sanitization can lead to XSS attacks
- **Fix:** Implement proper HTML sanitization using DOMPurify before rendering markdown output
- **Files Modified:** `package.json`, `src/routes/+page.svelte`

### 1.2 External Link Security Hardening

- **Issue:** External links missing security attributes (`rel="noopener noreferrer"`)
- **Fix:** Add security attributes to all external hrefs in rendered content
- **Scope:** Markdown-rendered chat messages

### 1.3 Code Cleanup

- Remove unused variables: `capabilities` (line 84), `obj` (line 173)
- Fix loop index naming: prefix with underscore (`_i`) for intentionally unused variables
- Fix typo: `assitantId` → `assistantId` (lines 159, 160)
- Remove or wrap console.log statements in dev-only conditionals (lines 113, 167, 180)
- Remove deprecated `pedantic: false` from marked options

### 1.4 Formatting Standards

- Run `npm run format` to align with project standards

---

## Phase 2: Architecture Refactoring (Priority: High) 🔜 PENDING

### 2.1 Component Extraction Strategy

Create new files in `src/lib/components/`:

| Component                  | Purpose                | Responsibility                                        |
| -------------------------- | ---------------------- | ----------------------------------------------------- |
| `AssistantSelector.svelte` | Persona selection UI   | Display assistant buttons, handle selection           |
| `ChatMessage.svelte`       | Message display        | Render user/AI messages with markdown, action buttons |
| `ErrorBoundary.svelte`     | Error state display    | Show error message with retry functionality           |
| `MessageActions.svelte`    | Copy/playback controls | Handle clipboard and TTS interactions                 |

### 2.2 State Management Refactor

- **Create:** `src/lib/chatStore.js` using Svelte writable store
- **Move:** All reactive state from component to store:
  - `selectedAssistantId`, `session`, `messages`, `textInputValue`
  - `voices`, `alreadySpeaking` (TTS-related)
- **Benefit:** Better reusability, testability, separation of concerns

### 2.3 Assistant Definitions Module

- **Create:** `src/lib/assistants.js`
- **Move:** All four persona definitions (`NanoCat`, `AiPierre`, `LoFia`, `Poshai`)
- **Export:** As array for dynamic rendering

---

## Phase 3: Speech Synthesis Fixes (Priority: High) 🔜 PENDING

### 3.1 Voice Loading Race Condition

- Add listener for `window.addEventListener('voiceschanged', ...)`
- Implement voice loading with timeout fallback mechanism
- Graceful degradation if no English voices available

### 3.2 TTS State Management

- Reset `alreadySpeaking` flag on speech completion via `speech.onend = () => alreadySpeaking = false`
- Extract pitch/rate to constants (currently hardcoded as 1.15)

---

## Phase 4: Performance Optimization (Priority: Medium) 🔜 PENDING

### 4.1 Message Update Efficiency

- Avoid recreating entire message object on every stream chunk
- Mutate only `text` property of existing message object in place

### 4.2 Scroll Debouncing

- Implement debounced version of `scrollToBottom()` function
- Or use Intersection Observer to detect user scroll position near bottom

---

## Phase 5: Accessibility Compliance (Priority: Medium) 🔜 PENDING

### 5.1 ARIA Labels & Keyboard Navigation

- Add `aria-label` attributes to all interactive elements (buttons, icons)
- Implement keyboard navigation for message action toolbar
- Address Svelte warnings about static element interactions

### 5.2 Error UI Improvements

- Replace browser `alert()` with accessible error component
- Provide retry functionality via `<ErrorBoundary.svelte>`

---

## Phase 6: Security Hardening (Priority: Medium) 🔜 PENDING

### 6.1 Clipboard API Safety

- Wrap `navigator.clipboard.writeText()` in try-catch blocks
- Add user feedback for copy success/failure (toast notification or status message)

---

## Implementation Order & Dependencies

```
Phase 1 → Phase 2 → Phase 3 → Phase 4/5 → Phase 6
   ↓           ↓           ↓         ↘      ↗
Security    Refactor    TTS       Perf   Security
Foundation  (parallel)  Stability (async) Hardening
```

---

## Status Summary

| Phase | Description              | Status      | Priority |
| ----- | ------------------------ | ----------- | -------- |
| 1     | Security & Quality Fixes | ✅ COMPLETE | Critical |
| 2     | Architecture Refactoring | 🔜 PENDING  | High     |
| 3     | Speech Synthesis Fixes   | 🔜 PENDING  | High     |
| 4     | Performance Optimization | 🔜 PENDING  | Medium   |
| 5     | Accessibility Compliance | 🔜 PENDING  | Medium   |
| 6     | Security Hardening       | 🔜 PENDING  | Medium   |

---

## Estimated Impact

- **Security:** Eliminates XSS vulnerability, protects against external link attacks
- **Maintainability:** Reduces monolithic component by ~70%, improves code organization
- **Performance:** Reduces unnecessary re-renders, prevents scroll thrashing
- **Accessibility:** Achieves WCAG compliance for keyboard navigation and ARIA standards

---

_Last Updated: March 23, 2026_
