# Code Quality & Architecture Fixes - nano-chat

## Critical Issues

### 1. XSS Vulnerability (src/routes/+page.svelte:237)

**Issue:** Using `{@html}` without sanitization can lead to XSS attacks
**Fix:** Implement proper HTML sanitization using DOMPurify or similar library before rendering markdown output

### 2. Unused Variables (src/routes/+page.svelte)

- **Line 84:** `capabilities` is assigned but never used
- **Line 173:** Parameter `obj` in `onTextMessageClick` is unused
- **Line 222:** Loop index `i` in `{#each}` is unused

**Fix:** Remove unused variables or prefix with underscore if intentionally unused (e.g., `_i`)

### 3. Prettier Formatting

**Issue:** opencode.json doesn't match project formatting standards
**Fix:** Run `npm run format` to auto-fix

## Architecture Improvements

### 4. State Management

**Issue:** All state and logic is in a single component, making it hard to maintain
**Fix:**

- Extract assistant definitions to separate file (e.g., `src/lib/assistants.js`)
- Create reusable components for chat messages, message actions, assistant buttons
- Move chat logic to Svelte store or context

### 5. Error Handling

**Issue:** Generic error alerts with `alert(err)` are poor UX
**Fix:** Implement proper error UI component with retry functionality

### 6. Speech Synthesis Issues

**Issue:**

- Voices array may be empty initially (race condition)
- No fallback if no English voices available
- `alreadySpeaking` state doesn't properly reset on completion

**Fix:**

- Add event listener for `voiceschanged` event
- Implement voice loading with timeout/fallback
- Reset `alreadySpeaking` when speech ends via `onend` handler

### 7. Memory Leaks

**Issue:** Session not properly destroyed if component unmounts before cleanup
**Fix:** Add `$effect.pre()` or onDestroy hook to ensure session cleanup on unmount

### 8. Accessibility Issues

**Issue:**

- Svelte ignores for click events (`a11y_no_static_element_interactions`)
- No keyboard navigation support for message actions
- Missing ARIA labels for buttons and icons

**Fix:** Add proper `tabindex`, `aria-label` attributes, and keyboard event handlers

### 9. Typo in Function Name

**Issue:** Parameter name typo: `assitantId` should be `assistantId` (line 159)
**Fix:** Correct spelling throughout

### 10. Markdown Configuration

**Issue:** Using deprecated `pedantic: false` option in marked options
**Fix:** Remove deprecated options, use current marked configuration

## Code Style Issues

### 11. Inconsistent Naming

- Mix of camelCase (`textInputValue`) and inconsistent patterns
- Function names could be more descriptive (e.g., `handleSendMessage` instead of `onKeyDown`)

### 12. Magic Numbers

**Issue:** Hardcoded values like `pitch = 1.15`, `rate = 1.15`, `timeout: 250`
**Fix:** Extract to constants with descriptive names

### 13. Console Logging in Production

**Issue:** Multiple `console.log` statements left in code (lines 113, 167, 180)
**Fix:** Remove or wrap in development-only conditional

## Performance Issues

### 14. Inefficient Message Updates

**Issue:** Creating new message object on every chunk update causes unnecessary re-renders
**Fix:** Update only the text property of existing message object instead of replacing entire object

### 15. Scroll Performance

**Issue:** `scrollToBottom` called on every chunk may cause performance issues with long responses
**Fix:** Debounce scroll calls or use intersection observer to detect when user is near bottom

## Security Issues

### 16. Clipboard API Without Error Handling

**Issue:** `navigator.clipboard.writeText()` without try-catch
**Fix:** Wrap in error handling with user feedback

### 17. External Links Without Safety Attributes

**Issue:** External links missing `rel="noopener noreferrer"`
**Fix:** Add security attributes to all external hrefs
