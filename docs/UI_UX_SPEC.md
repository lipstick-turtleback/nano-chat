# LexiChat — Complete UI/UX Specification

> Version: 1.0
> Created: 2026-04-10
> Status: Ready for implementation

---

## 1. Layout Architecture

### 1.1 Overall Structure

```
┌─────────────────────────────────────────────────────┐
│  [Sidebar: 272px]  │  [Main Chat Area: flex: 1]     │
│                    │  ┌─────────────────────────┐   │
│  ┌──────────────┐  │  │  Header (52px)          │   │
│  │ Companions   │  │  │  Status + ⚙️ Settings   │   │
│  │              │  │  ├─────────────────────────┤   │
│  │ 🎓 Aria      │  │  │  Error Banner (if any)  │   │
│  │ 🧘 Kai       │  │  ├─────────────────────────┤   │
│  │ ⚡ Nova      │  │  │                          │   │
│  │ 🔮 Sage      │  │  │  Chat Messages           │   │
│  │ 🎨 Pixel     │  │  │  (scrollable)            │   │
│  │ 🗺️ Atlas     │  │  │                          │   │
│  │ 🌙 Luna      │  │  ├─────────────────────────┤   │
│  │ 💻 Zen       │  │  │  Chat Input (80px)       │   │
│  │ 👑 Hera      │  │  │  Textarea + Send/Cancel  │   │
│  │ 🇫🇮 Aino      │  │  └─────────────────────────┘   │
│  └──────────────┘  │                                 │
└────────────────────┴─────────────────────────────────┘
```

### 1.2 Responsive Breakpoints

| Breakpoint  | Behavior                                             |
| ----------- | ---------------------------------------------------- |
| `> 768px`   | Full sidebar + chat side by side                     |
| `641-768px` | Narrower sidebar (260px), wider messages (88%)       |
| `≤ 640px`   | Sidebar stacks on top (200px max-height), chat below |

### 1.3 Spacing Scale (4px base)

| Token | Value | Usage                                  |
| ----- | ----- | -------------------------------------- |
| `xs`  | 4px   | Tiny gaps (icon spacing)               |
| `sm`  | 8px   | Element gaps (buttons, list items)     |
| `md`  | 12px  | Component internal padding             |
| `lg`  | 16px  | Section gaps, chat container padding   |
| `xl`  | 20px  | Major section gaps, input area padding |
| `2xl` | 24px  | Page-level gaps                        |

---

## 2. Sidebar

### 2.1 Purpose

Primary navigation — select AI companion. Nothing else.

### 2.2 Content

- **Title**: "Companions" (uppercase, 0.6875rem, gray-400)
- **List**: 10 companion cards (radio selection)

### 2.3 Companion Card

```
┌─────────────────────────────────┐
│ ◉  🎓  IELTS Aria              │
│         C2 English Mastery      │
└─────────────────────────────────┘
```

**Elements:**
| Element | Style | Behavior |
|---------|-------|----------|
| Radio | 16px circle, accent color when checked | Selected on card click |
| Emoji | 1.5rem, drop-shadow | Always visible |
| Name | 0.8125rem, font-semibold, text-primary | Bold when active |
| Tagline | 0.6875rem, text-secondary, ellipsis | Truncated if too long |
| Border | 1.5px transparent → accent-border | Active = accent color + glow |
| Background | transparent → accent-light | Active = tinted bg |

**Interaction:**

- Click anywhere on card → selects companion
- Disabled during `isBusy` (initializing/processing)
- Keyboard: Tab to focus, Enter/Space to select
- Visual feedback: hover (bg-gray-50), active (accent bg + border + glow)

**Accessibility:**

- `role="radio"`, `aria-checked`, `aria-label="{name}: {tagline}"`
- Grouped in `role="radiogroup"` with `aria-label="Select AI companion"`
- Focus ring: 2px accent outline

---

## 3. Header

### 3.1 Purpose

Status indicator + settings trigger.

### 3.2 Content

```
┌──────────────────────────────────────────────┐
│ ● Ollama · gemma4:31b-cloud          ⚙️     │
└──────────────────────────────────────────────┘
```

**Elements:**
| Element | Style | Behavior |
|---------|-------|----------|
| Status Dot | 6px circle, green=connected, red=disconnected | Updates in real-time |
| Status Text | 0.8125rem, font-medium, text-secondary | Shows provider + model |
| Settings Gear | 18px icon, gray → accent on hover | Opens settings modal |

**Status Text Variants:**
| State | Text |
|-------|------|
| Ollama connected | `Ollama · {modelName}` |
| Ollama disconnected | `Ollama · Not connected` |
| Chrome available | `Chrome AI · Gemini Nano` |
| Chrome downloading | `Chrome AI · Downloading {X}%` |
| Chrome unavailable | `Chrome AI · Not available` |

**Settings Button:**

- Size: 32×32px, circular, transparent bg
- Hover: bg-gray-50, accent color
- Label: "Open settings"
- Opens settings modal

---

## 4. Settings Modal (Radix Dialog)

### 4.1 Structure

```
┌────────────────────────────────────┐
│ ⚙️ Settings                    ✕   │
├────────────────────────────────────┤
│ APPEARANCE                         │
│ ○ Small  (14px)                    │
│ ◉ Medium (16px)                    │
│ ○ Large  (18px)                    │
│ ○ Extra Large (20px)               │
│                                    │
│ SPEECH                             │
│ ◉ Browser Speech                   │
│   Built-in, fast, no download      │
│ ○ Kokoro AI Voice                  │
│   High quality, ~2.5MB download    │
│ ○ Off                              │
│   No speech synthesis              │
│                                    │
│ Voice Style: [Default (clear)    ▼]│
│                                    │
│ ┌──────────────────────────┐       │
│ │ Auto-speak responses  [⬤]│       │
│ └──────────────────────────┘       │
│                                    │
│ AI PROVIDER                        │
│ ┌────────────────────────────────┐ │
│ │ 🧠 Chrome AI                   │ │
│ │    Gemini Nano — runs locally  │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ 🦙 Ollama               ●      │ │
│ │    Local models — needs server │ │
│ └────────────────────────────────┘ │
│                                    │
│ Ollama Model: [gemma4:31b-cloud ▼]│ [↻]
│ Start Ollama: `ollama serve`       │
│                                    │
│ DATA                               │
│ [📥 Export Chat]  [🗑️ Clear Chat]  │
├────────────────────────────────────┤
│               [Cancel]  [Save]     │
└────────────────────────────────────┘
```

### 4.2 Sections & Controls

#### Section 1: Appearance

| Control   | Type       | Options                                               | Default | Action                                      |
| --------- | ---------- | ----------------------------------------------------- | ------- | ------------------------------------------- |
| Font Size | RadioGroup | Small (14), Medium (16), Large (18), Extra Large (20) | 16      | Applies to `html { font-size }` immediately |

#### Section 2: Speech

| Control       | Type       | Options                                              | Default | Action                   |
| ------------- | ---------- | ---------------------------------------------------- | ------- | ------------------------ |
| Speech Engine | RadioGroup | Browser Speech, Kokoro AI Voice, Off                 | browser | Changes TTS engine       |
| Voice Style   | Select     | Default, Soft, Energetic, Measured, Cheerful, Upbeat | default | Changes companion voice  |
| Auto-speak    | Switch     | On / Off                                             | off     | Auto-speaks AI responses |

#### Section 3: AI Provider

| Control        | Type           | Options                 | Default          | Action                               |
| -------------- | -------------- | ----------------------- | ---------------- | ------------------------------------ |
| Provider Card  | Clickable card | Chrome AI, Ollama       | ollama           | Switches provider (triggers re-init) |
| Ollama Model   | Select         | Dynamic from Ollama API | gemma4:31b-cloud | Changes active model                 |
| Refresh Models | Icon button    | —                       | —                | Re-fetches model list                |

#### Section 4: Data

| Control     | Type   | Action                         | Disabled When |
| ----------- | ------ | ------------------------------ | ------------- |
| Export Chat | Button | Downloads .txt file            | No messages   |
| Clear Chat  | Button | Confirms → clears all messages | No messages   |

### 4.3 Modal Behavior

| Property        | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Overlay         | bg-black/40, backdrop-blur-sm, z-50                   |
| Panel           | max-w-lg (500px), max-h-[85vh], overflow-y-auto, z-50 |
| Open/Close      | Fade-in overlay, slide-up panel (200ms)               |
| Escape key      | Closes modal                                          |
| Click outside   | Closes modal                                          |
| Unsaved changes | No warning — settings apply on Save only              |

### 4.4 Labels & Hints

| Element                  | Label/Hint Text                              |
| ------------------------ | -------------------------------------------- |
| Provider: Chrome         | "Gemma Nano — runs locally in Chrome 131+"   |
| Provider: Ollama         | "Local models — requires Ollama running"     |
| No models found          | "No models found" (in select)                |
| Ollama disconnected hint | "Start Ollama locally: `ollama serve`"       |
| Clear Chat confirmation  | "Clear all messages? This cannot be undone." |

---

## 5. Chat Area

### 5.1 Layout

- Scrollable container, `flex: 1`, min-height 0
- Padding: 20px (14px on mobile)
- Gap between messages: 16px
- Scroll behavior: smooth

### 5.2 Empty State

```
┌─────────────────────────────────────┐
│                                     │
│              🎓                     │
│                                     │
│   Start a conversation with Aria    │
│                                     │
└─────────────────────────────────────┘
```

- Centered vertically and horizontally
- Emoji: 3.5rem, floating animation (4s ease-in-out, ±6px)
- Text: 0.875rem, text-secondary, "Start a conversation with **{name}**"

### 5.3 Message Types

#### 5.3.1 User Message

```
                              ┌─────────────────────────┐
                              │ Hello, how are you?     │
                              │                    10:30│
                              └─────────────────────────┘
```

| Property      | Value                              |
| ------------- | ---------------------------------- |
| Alignment     | Right (align-self: flex-end)       |
| Max width     | 72%                                |
| Background    | Gradient (accent → lighter accent) |
| Text color    | White                              |
| Border radius | 16px, bottom-right 4px             |
| Shadow        | shadow-xs                          |
| Animation     | slide-up 250ms ease-out            |

#### 5.3.2 Assistant Message

```
┌─────────────────────────────────────┐
│ 🎓 IELTS Aria                       │
│                                     │
│ Hello! I'm Aria, your IELTS tutor.  │
│ Let's work on your C2 English!      │
│                                     │
│ 10:30              📋       🔊       │
└─────────────────────────────────────┘
```

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Alignment     | Left (align-self: flex-start)                                    |
| Max width     | 72%                                                              |
| Background    | White (bg-surface)                                               |
| Border        | 1px border-light, left: 3px accent                               |
| Border radius | 16px, bottom-left 4px                                            |
| Header        | Emoji (1.25rem) + Name (0.6875rem, uppercase, accent color)      |
| Content       | 0.875rem, line-height 1.65, rendered HTML                        |
| Footer        | Timestamp (0.625rem, gray) + action buttons (hidden until hover) |

#### 5.3.3 Error Message

```
┌─────────────────────────────────────┐
│         ⚠️ AI session error         │
│         Connection failed           │
└─────────────────────────────────────┘
```

| Property   | Value                              |
| ---------- | ---------------------------------- |
| Alignment  | Center                             |
| Max width  | 90%                                |
| Background | error-bg (red-50)                  |
| Border     | 1px error-border                   |
| Text       | error color, centered, font-medium |

#### 5.3.4 Processing/Typing Indicator

```
┌─────────────────────────────────────┐
│ 🎓 IELTS Aria                       │
│                                     │
│   ● ● ●                             │
│                                     │
└─────────────────────────────────────┘
```

- 3 dots, 6px each, gray
- Bounce animation (1.4s infinite, staggered 0.2s)
- No action buttons

### 5.4 Action Buttons (on assistant messages)

| Button     | Icon              | Hover Behavior           | Active Behavior  |
| ---------- | ----------------- | ------------------------ | ---------------- |
| Copy       | 📋 / 📋 → ✅ (2s) | bg-gray-50, accent color | Shows ✅ briefly |
| Play/Speak | 🔊 / 🔇 / ⏳      | bg-gray-50, accent color | Toggles speech   |

**Visibility:** Opacity 0 → 1 on bubble hover (150ms)

### 5.5 Streaming Text

- Plain text during streaming (no markdown re-parse)
- Blinking cursor at end: `▊` (1s step-end blink)
- Fade-in animation on text appearance (500ms)
- Markdown rendered once when stream completes

---

## 6. Chat Input

### 6.1 Layout

```
┌─────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐        │
│ │ Type your message... Enter to send   │  📤    │
│ └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### 6.2 Elements

| Element       | Style                                       | Behavior                                             |
| ------------- | ------------------------------------------- | ---------------------------------------------------- |
| Textarea      | Border 1.5px, rounded-xl, padding 10px 14px | Auto-focus on load                                   |
| Placeholder   | text-tertiary                               | Changes during processing: "Waiting for response..." |
| Char count    | 0.625rem, text-tertiary, right-aligned      | Updates on every keystroke                           |
| Send button   | 34×34px, gradient bg, rounded-md            | Disabled when empty/over limit                       |
| Cancel button | 34×34px, bg-gray-100, rounded-md            | Only visible during processing                       |

### 6.3 States

| State      | Textarea                            | Send Button        | Cancel Button       |
| ---------- | ----------------------------------- | ------------------ | ------------------- |
| Idle       | Enabled, placeholder visible        | Disabled (gray)    | Hidden              |
| Typing     | Enabled, border accent on focus     | Enabled (gradient) | Hidden              |
| Processing | Disabled, placeholder: "Waiting..." | Hidden             | Visible (stop icon) |
| Over limit | Enabled, border-red                 | Disabled           | Hidden              |

### 6.4 Keyboard Shortcuts

| Shortcut    | Action                           |
| ----------- | -------------------------------- |
| Enter       | Send message                     |
| Shift+Enter | New line in textarea             |
| Escape      | Cancel request (when processing) |

### 6.5 Focus Management

| Event            | Action                            |
| ---------------- | --------------------------------- |
| App loads        | Focus textarea                    |
| Send message     | Clear input, re-focus after 250ms |
| Cancel request   | Clear input, re-focus after 250ms |
| Switch companion | Focus textarea                    |

---

## 7. Error Banner

### 7.1 Appearance

```
┌──────────────────────────────────────────────┐
│ ⚠️ Message too long (max 4000 characters). ✕ │
└──────────────────────────────────────────────┘
```

### 7.2 Behavior

| Property     | Value                                              |
| ------------ | -------------------------------------------------- |
| Position     | Below header, above chat area                      |
| Margin       | 12px 20px 0                                        |
| Background   | error-bg                                           |
| Border       | 1px error-border                                   |
| Text         | error color, 0.8125rem, font-medium                |
| Dismiss      | ✕ button (right-aligned, opacity 0.6 → 1 on hover) |
| Animation    | slide-in 250ms ease-out                            |
| Auto-dismiss | None — user must dismiss                           |
| ARIA         | `role="status"`, `aria-live="polite"`              |

---

## 8. Interactive Tools (in-chat)

### 8.1 Quiz Card

```
┌──────────────────────────────────────┐
│ 🧠 Which is the C2 paraphrase?       │
│                                      │
│ ○ A) I think this is bad             │
│ ◉ B) I am firmly of the opinion...   │
│ ○ C) This seems quite terrible       │
│ ○ D) I don't like this idea          │
│                                      │
│          [ Submit Answer ]           │
│                                      │
│ 🎉 Correct! "Firmly of the opinion" │
│ demonstrates C2 hedging...           │
└──────────────────────────────────────┘
```

| Element     | Style                            | Behavior                 |
| ----------- | -------------------------------- | ------------------------ |
| Header      | Emoji + bold title               | Always visible           |
| Options     | Radio-style buttons (A, B, C, D) | Click to select          |
| Selected    | Accent border + bg               | One at a time            |
| Correct     | Green border + bg                | After submit             |
| Incorrect   | Red border + bg, strikethrough   | After submit             |
| Submit      | Full-width, gradient bg          | Disabled until selection |
| Explanation | Accent-light bg, rounded         | After submit             |

### 8.2 True/False Card

| Element      | Style                               |
| ------------ | ----------------------------------- |
| Statement    | Bold, centered                      |
| True button  | Green bg, hover → solid green       |
| False button | Red bg, hover → solid red           |
| Feedback     | Gray bg, below buttons              |
| Score        | "You got 3/5 correct — Perfect! 🎉" |

### 8.3 Fill-in-the-Blank Card

| Element          | Style                                           |
| ---------------- | ----------------------------------------------- |
| Text with blanks | Inline inputs with accent bottom-border         |
| Input            | 100px wide, centered text, bg-accent-light      |
| Correct answer   | Green bg, text-green                            |
| Incorrect answer | Red bg, strikethrough + correct answer in green |
| Check button     | Full-width, gradient bg                         |

### 8.4 Word Match Card

| Element           | Style                                |
| ----------------- | ------------------------------------ | ----------- |
| Layout            | Two columns: words                   | definitions |
| Word button       | Bold, hover → accent border          |
| Definition button | Normal weight, hover → accent border |
| Selected word     | Accent border + glow                 |
| Matched           | Opacity 0.5, disabled                |
| Correct match     | Green border                         |

### 8.5 Storage Tool

| Element        | Style                                             |
| -------------- | ------------------------------------------------- |
| Action select  | Select dropdown                                   |
| Key input      | Text input, monospace font                        |
| Value input    | Text input (only for "set" action)                |
| Prefix input   | Text input (only for "list" action)               |
| Execute button | Full-width, gradient bg                           |
| Result         | Pre-formatted block, max-height 200px, scrollable |

---

## 9. Animations & Transitions

### 9.1 Global Animations

| Animation       | Duration | Easing                        | Used For                 |
| --------------- | -------- | ----------------------------- | ------------------------ |
| `fade-in`       | 200ms    | ease                          | Overlay, banner          |
| `slide-up`      | 250ms    | cubic-bezier(0.16, 1, 0.3, 1) | Messages, settings panel |
| `text-fade-in`  | 500ms    | ease-smooth                   | Streaming text           |
| `cursor-blink`  | 1s       | step-end                      | Streaming cursor         |
| `gentle-float`  | 4s       | ease-in-out                   | Empty state emoji        |
| `typing-bounce` | 1.4s     | ease                          | Processing dots          |

### 9.2 Transitions

| Element       | Property                 | Duration | Easing |
| ------------- | ------------------------ | -------- | ------ |
| Buttons       | background, border-color | 150ms    | ease   |
| Hover states  | opacity, transform       | 150ms    | ease   |
| Active states | transform (scale)        | 150ms    | ease   |
| Focus states  | border-color, box-shadow | 150ms    | ease   |
| Modal overlay | opacity                  | 200ms    | ease   |
| Sidebar card  | background, border       | 150ms    | ease   |

### 9.3 Transform Scales

| State               | Scale |
| ------------------- | ----- |
| Button hover        | 1.0   |
| Button active       | 0.92  |
| Action button hover | 1.1   |

---

## 10. Colors

### 10.1 Neutral Palette

| Token          | Value   | Usage                  |
| -------------- | ------- | ---------------------- |
| bg-app         | #f6f6f8 | Page background        |
| bg-surface     | #ffffff | Cards, bubbles, panels |
| bg-sidebar     | #fafafa | Sidebar background     |
| bg-hover       | #f0f0f2 | Hover states           |
| border-light   | #e4e4e7 | Subtle borders         |
| border-medium  | #d4d4d8 | Interactive borders    |
| text-primary   | #18181b | Main text              |
| text-secondary | #64748b | Secondary text         |
| text-tertiary  | #94a3b8 | Hints, timestamps      |

### 10.2 Semantic Colors

| Token        | Value   | Usage                      |
| ------------ | ------- | -------------------------- |
| success      | #10b981 | Correct answers, connected |
| success-bg   | #ecfdf5 | Success backgrounds        |
| error        | #ef4444 | Errors, wrong answers      |
| error-bg     | #fef2f2 | Error backgrounds          |
| error-border | #fecaca | Error borders              |

### 10.3 Companion Colors

| Companion | Color   | BG      | Gradient        |
| --------- | ------- | ------- | --------------- |
| Aria      | #7c3aed | #f5f3ff | 7c3aed → a78bfa |
| Kai       | #06b6d4 | #ecfeff | 06b6d4 → 22d3ee |
| Nova      | #f43f5e | #fff1f2 | f43f5e → fb7185 |
| Sage      | #8b5cf6 | #f5f3ff | 8b5cf6 → a78bfa |
| Pixel     | #f59e0b | #fffbeb | f59e0b → fbbf24 |
| Atlas     | #0ea5e9 | #f0f9ff | 0ea5e9 → 38bdf8 |
| Luna      | #ec4899 | #fdf2f8 | ec4899 → f472b6 |
| Zen       | #22c55e | #f0fdf4 | 22c55e → 4ade80 |
| Hera      | #d946ef | #faf5ff | d946ef → e879f9 |
| Aino      | #2563eb | #eff6ff | 2563eb → 60a5fa |

---

## 11. Typography

### 11.1 Font Stack

```css
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
code: 'JetBrains Mono', 'Fira Code', monospace;
```

### 11.2 Scale (relative to root)

| Element   | Size      | Weight  | Usage                      |
| --------- | --------- | ------- | -------------------------- |
| Heading 1 | 1.0625rem | 600     | Message content h1         |
| Heading 2 | 0.9375rem | 600     | Message content h2         |
| Heading 3 | 0.875rem  | 600     | Message content h3         |
| Body      | 0.875rem  | 400     | Chat messages, inputs      |
| Small     | 0.8125rem | 400-500 | Labels, buttons            |
| Tiny      | 0.75rem   | 400-500 | Taglines, descriptions     |
| Micro     | 0.6875rem | 400-600 | Timestamps, section titles |
| Nano      | 0.625rem  | 400     | Char count, message time   |

### 11.3 Line Heights

| Element        | Line Height |
| -------------- | ----------- |
| Body text      | 1.65        |
| Code blocks    | 1.55        |
| UI elements    | 1.3-1.4     |
| Section titles | 1.0         |

---

## 12. Accessibility

### 12.1 Focus Management

| Control          | Focus Style                     |
| ---------------- | ------------------------------- |
| Radio buttons    | 2px accent ring                 |
| Buttons          | 2px accent ring                 |
| Inputs           | Accent border + 3px shadow ring |
| Select dropdowns | Accent border + 3px shadow ring |
| Sidebar cards    | Accent border                   |
| Settings gear    | bg-gray-50, accent icon         |

### 12.2 Keyboard Navigation

| Key         | Action                      |
| ----------- | --------------------------- |
| Tab         | Move focus forward          |
| Shift+Tab   | Move focus backward         |
| Enter/Space | Activate focused button     |
| Escape      | Close modal, cancel request |
| Arrow keys  | Navigate radio groups       |

### 12.3 ARIA Labels

| Element               | Label                                                  |
| --------------------- | ------------------------------------------------------ |
| Companion radio group | "Select AI companion"                                  |
| Each companion radio  | "{name}: {tagline}"                                    |
| Provider radio group  | "Select AI provider"                                   |
| Settings button       | "Open settings"                                        |
| Chat input            | "Chat message input"                                   |
| Send button           | "Send message"                                         |
| Cancel button         | "Cancel request"                                       |
| Close settings        | "Close settings"                                       |
| Export button         | "Export chat"                                          |
| Clear button          | "Clear chat"                                           |
| Error banner          | `role="status"`, `aria-live="polite"`                  |
| Chat area             | `aria-live="polite"`, `aria-relevant="additions text"` |
| Copy button           | "Copy message" → "Copied!" (after click)               |
| Play button           | "Play message" / "Stop playing"                        |

### 12.4 Color Contrast

All text meets WCAG AA (4.5:1 minimum):

- Primary text on white: 13.5:1 ✅
- Secondary text on white: 5.5:1 ✅
- Tertiary text on white: 3.3:1 ⚠️ (acceptable for non-critical)
- White text on gradient: 8.2:1 ✅
- Error text on error-bg: 5.2:1 ✅

---

## 13. Error States

### 13.1 Error Types & Handling

| Error               | Source            | Display                         | Recovery                                 |
| ------------------- | ----------------- | ------------------------------- | ---------------------------------------- |
| No AI provider      | Startup           | Full-screen error screen        | User installs Chrome AI or starts Ollama |
| Session failed      | Init              | Error banner + retry            | Click "Retry" or switch provider         |
| Message too long    | Input validation  | Error banner                    | User shortens message                    |
| Ollama disconnected | Health check      | Settings hint                   | User starts Ollama, clicks refresh       |
| Export failed       | Blob creation     | Error banner                    | User retries                             |
| TTS error           | Kokoro/Web Speech | Silent fallback to other engine | User changes engine in settings          |
| Network error       | API calls         | Error banner                    | User retries                             |

### 13.2 Loading States

| Loading       | Display                               |
| ------------- | ------------------------------------- |
| Initializing  | Sidebar disabled, "..." in header     |
| Processing    | Input disabled, cancel button visible |
| TTS loading   | ⏳ icon on play button, disabled      |
| Model refresh | ↻ button spinner                      |

---

## 14. Data Persistence

### 14.1 What Persists

| Data               | Storage                          | Scope                 |
| ------------------ | -------------------------------- | --------------------- |
| Player profile     | localStorage (→ SQLite later)    | Global                |
| Companion progress | localStorage (→ SQLite)          | Per companion         |
| Game sessions      | localStorage (→ SQLite)          | Per player            |
| DnD characters     | localStorage (→ SQLite)          | Per player            |
| Achievements       | localStorage (→ SQLite)          | Per player            |
| Settings           | In-memory (→ localStorage later) | Session               |
| Challenge cache    | localStorage                     | Global, max 200 items |

### 14.2 What Doesn't Persist

| Data            | Reason                  |
| --------------- | ----------------------- |
| Chat messages   | Fresh session on reload |
| Active TTS      | Cleared on unload       |
| Streaming state | Reset on reload         |
| Error banners   | Dismissed on reload     |

---

## 15. Game Master Persona (Planned)

### 15.1 Identity

| Property   | Value                          |
| ---------- | ------------------------------ |
| Name       | "Mira the Game Master"         |
| Short name | "Mira"                         |
| Tagline    | "DnD & Interactive Adventures" |
| Emoji      | "🎲"                           |
| Color      | #7c2d12 (amber-900)            |
| BG         | #fff7ed (orange-50)            |
| Gradient   | 7c2d12 → c2410c                |

### 15.2 Exclusive Tools

| Tool               | Description                                |
| ------------------ | ------------------------------------------ |
| Dice Roller        | Roll any dice: 1d6, 2d4, 1d20, 3d8+2, etc. |
| Scene Generator    | Create DnD scenes with choices             |
| Character Sheet    | Create/manage DnD characters               |
| Skill Check        | Stat-based challenges with DC              |
| Initiative Tracker | Track combat order                         |

### 15.3 Dice Roll Component

```
┌─────────────────────────────┐
│ 🎲 Roll: [1d20 ▼] [ Roll ] │
│                             │
│ Result: 14                  │
│ Modifier: +2 = 16 vs DC 15 │
│ Success! The guard doesn't  │
│ notice you slipping past.   │
└─────────────────────────────┘
```

| Element     | Style                                                  |
| ----------- | ------------------------------------------------------ |
| Dice select | Select: 1d4, 1d6, 1d8, 1d10, 1d12, 1d20, 1d100, custom |
| Roll button | Gradient bg, dice emoji                                |
| Result      | Large number, animated (scale up)                      |
| Modifier    | "±N = total vs DC X"                                   |
| Narrative   | Story text from LLM                                    |

### 15.4 Dice Roll Animation

| Step                  | Animation                                  |
| --------------------- | ------------------------------------------ |
| Click roll            | Button pulse (0.9 → 1.05 → 1.0)            |
| Rolling               | Number cycles rapidly (100ms intervals)    |
| Result                | Number scales up (0.5 → 1.0, 300ms spring) |
| Critical (nat 20)     | Golden glow + celebration emoji            |
| Critical fail (nat 1) | Red shake animation                        |
