# Nano-Chat Architecture & Code Overview

## Project Summary

**Nano-Chat** is a SvelteKit-based web application that provides an AI chat interface with multiple character personas. It leverages Chrome 131's built-in Gemini Nano model for local AI processing and includes text-to-speech capabilities.

### Tech Stack

- **Framework:** SvelteKit 2.x with Svelte 5 runes API
- **Build Tool:** Vite 5.x
- **Styling:** TailwindCSS + custom CSS
- **Markdown:** Marked 14.x
- **AI Backend:** Chrome AI API (Gemini Nano)

---

## File Structure

```
nano-chat/
├── src/
│   ├── lib/
│   │   └── index.js           # Library export placeholder (empty)
│   ├── routes/
│   │   ├── +layout.svelte     # Root layout component
│   │   └── +page.svelte       # Main chat interface (406 lines, single file)
│   ├── app.css               # Global styles
│   └── app.html              # HTML template
├── static/                   # Static assets
├── .svelte-kit/            # Build artifacts
├── node_modules/           # Dependencies
├── package.json            # Project configuration
├── svelte.config.js        # SvelteKit config
├── vite.config.js          # Vite config
└── ISSUES_TO_FIX.md        # Existing issue tracking
```

---

## Component Architecture

### Single-Component Application

The entire application logic resides in **`src/routes/+page.svelte`** (406 lines). This monolithic structure includes:

1. **Assistant Definitions** (lines 5-75)

   - Four character personas hardcoded as constants:
     - `NanoCat`: Playful JavaScript advocate cat (Finnish/English bilingual)
     - `AiPierre`: French-speaking cultured parrot
     - `LoFia`: Concise, direct virtual assistant
     - `Poshai`: Elegant, sage-like advisor

2. **State Management** (lines 79-91)

   - Uses Svelte 5 runes (`$state`) for reactive state
   - Key states:
     ```javascript
     selectedAssistantId; // Currently active persona
     session; // AI session object
     messages; // Chat history array
     textInputValue; // User input binding
     voices; // Speech synthesis voices cache
     alreadySpeaking; // TTS playback state
     ```

3. **Core Functions** (lines 93-196)

   - `scrollToBottom(node)` - Smooth scroll to chat bottom
   - `init(assistantId)` - Initialize AI session with system prompt
   - `createMessageObj(text, srcType)` - Create message objects with markdown parsing
   - `processRequest(textRequest)` - Handle streaming responses
   - `onKeyDown(e)` - Handle Enter key for sending messages
   - `resetChat(assitantId)` - Reset chat (note: typo in parameter name)
   - `exportChat()` - Export chat history to console
   - `onTextMessageCopyTextClick(text)` - Copy message text to clipboard
   - `onTextMessagePlayTextClick(obj)` - Play/stop TTS for message

4. **Template Logic** (lines 197-275)
   - Error state display for missing AI capabilities
   - Chat container with role-based styling
   - Assistant switcher buttons
   - Message action toolbar (copy/playback)

---

## Data Flow

```
User Input → onKeyDown() → processRequest() → stream.promptStreaming()
→ Update messages array → Re-render chat-container → scrollToBottom()
```

**AI Session Lifecycle:**

1. Component mounts (line 196: `browser && init()`)
2. Validates Chrome AI capabilities
3. Creates session with system prompt from selected assistant description
4. Sends initial greeting message
5. Maintains session until component unmounts or new assistant selected

---

## External Dependencies

### Marked Parser (line 77)

```javascript
const markedOptions = { breaks: true, pedantic: false, async: false };
```

- Converts markdown to HTML for chat messages
- **Issue:** Uses deprecated `pedantic` option

### Speech Synthesis API

- Caches English US voices on init (line 111)
- Pitch/rate hardcoded to 1.15 (lines 186-187)
- Race condition risk: voices array may be empty initially

---

## Known Issues Summary

See **ISSUES_TO_FIX.md** for detailed issue tracking. Key categories:

### Critical Security

- XSS vulnerability via unsanitized `{@html}` rendering (line 237)
- External links missing security attributes (`rel="noopener noreferrer"`)

### Code Quality

- Unused variables (`capabilities`, `obj`, loop index `i`)
- Typo in function parameter: `assitantId` vs `assistantId`
- Console logs left in production code (lines 113, 167)

### Architecture

- Monolithic component violates separation of concerns
- No error UI component (uses browser alerts)
- State management should use Svelte stores for better reusability

### Performance

- Message object recreated on every chunk update causing unnecessary re-renders
- Scroll function called on every stream chunk without debouncing

### Accessibility

- Missing ARIA labels for interactive elements
- No keyboard navigation support for message actions
- Static element interaction warnings (line 224)

---

## Recommendations

### Phase 1: Immediate Fixes

1. Remove deprecated marked options
2. Fix parameter typo (`assitantId` → `assistantId`)
3. Add `rel="noopener noreferrer"` to external links
4. Remove console.log statements or wrap in dev-only conditionals

### Phase 2: Security Hardening

1. Implement HTML sanitization (DOMPurify) before rendering markdown output
2. Wrap clipboard API calls with proper error handling and user feedback

### Phase 3: Architecture Refactoring

1. Extract assistant definitions to `src/lib/assistants.js`
2. Create reusable components:
   - `<ChatMessage>` for message display
   - `<AssistantSelector>` for persona buttons
   - `<ErrorBoundary>` for error states
3. Move chat logic to Svelte store in `src/lib/chatStore.js`

### Phase 4: UX Improvements

1. Implement proper error UI component with retry functionality
2. Fix voice loading race condition with `voiceschanged` event listener
3. Add keyboard navigation and ARIA labels for accessibility compliance

---

## File Status

| File             | Lines | Complexity | Notes                         |
| ---------------- | ----- | ---------- | ----------------------------- |
| `+page.svelte`   | 406   | High       | Monolithic, needs refactoring |
| `+layout.svelte` | 6     | Low        | Simple wrapper                |
| `app.css`        | ~150  | Medium     | Custom chat styles            |
| `index.js`       | 1     | None       | Placeholder for lib exports   |

---

## Next Steps

This overview provides a foundation for systematic refactoring. Prioritize security fixes before architectural improvements to ensure application safety during development.
