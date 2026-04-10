# Chrome Built-in AI — Prompt API Specification

> Source: https://github.com/webmachinelearning/prompt-api
> Captured: 2026-04-10

---

## Global Entry Point

The API is exposed as the global `LanguageModel` object (NOT `window.ai.languageModel`).

```javascript
// Static methods
LanguageModel.create(options); // → Promise<Session>
LanguageModel.availability(options); // → Promise<"unavailable"|"downloadable"|"downloading"|"available">
LanguageModel.params(); // → Promise<{defaultTopK, maxTopK, defaultTemperature, maxTemperature}> (extensions only)
```

## Checking Availability

```javascript
const availability = await LanguageModel.availability({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }]
});

// Returns: "unavailable", "downloadable", "downloading", or "available"
if (availability !== 'unavailable') {
  if (availability !== 'available') {
    console.log('Sit tight, we need to do some downloading...');
  }
  const session = await LanguageModel.create(options);
} else {
  console.error('No language model for us :(');
}
```

## Creating a Session

```javascript
// Option 1: With system prompt in initialPrompts
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }]
});

// Option 2: Create then append system prompt
const session2 = await LanguageModel.create();
await session2.append([{ role: 'system', content: 'Pretend to be an eloquent hamster.' }]);

// Option 3: With download progress monitor
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});

// Option 4: With AbortSignal
const controller = new AbortController();
const session = await LanguageModel.create({ signal: controller.signal });
stopButton.onclick = () => controller.abort();
```

### Create Options

| Option            | Type                        | Description                                                             |
| ----------------- | --------------------------- | ----------------------------------------------------------------------- |
| `initialPrompts`  | `Array<{role, content}>`    | System prompt must be index 0. Can include user/assistant messages too. |
| `expectedInputs`  | `Array<{type, languages?>}` | `[{ type: "text\|image\|audio", languages: ["en"] }]`                   |
| `expectedOutputs` | `Array<{type, languages?>}` | `[{ type: "text", languages: ["en"] }]`                                 |
| `monitor`         | `(m) => void`               | Receives ProgressEvent target for download tracking. `e.loaded` is 0-1. |
| `signal`          | `AbortSignal`               | Cancel session creation.                                                |
| `temperature`     | `number`                    | Extensions/experimental only. < 0 → RangeError, > max → clamped.        |
| `topK`            | `number`                    | Extensions/experimental only. < 1 → RangeError, > max → clamped.        |
| `tools`           | `Array`                     | Tool use support (see below).                                           |

## Session Instance

### Properties

| Property        | Type      | Description                                    |
| --------------- | --------- | ---------------------------------------------- |
| `contextUsage`  | `number`  | Tokens used (renamed from legacy `inputUsage`) |
| `contextWindow` | `number`  | Max tokens (renamed from legacy `inputQuota`)  |
| `temperature`   | `number?` | Current temperature (extensions only)          |
| `topK`          | `number?` | Current topK (extensions only)                 |

### Methods

#### `session.prompt(input, options?)`

Returns the **complete** response string once generation finishes.

````javascript
// Simple text prompt
const result = await session.prompt('Write me a poem.');
console.log(result);

// Multi-turn prompt with history
const followup = await session.prompt([
  { role: 'user', content: "I'm nervous about my presentation" },
  { role: 'assistant', content: 'Presentations are tough!' }
]);

// With prefix (model continues from assistant prefix)
const charSheet = await session.prompt([
  { role: 'user', content: 'Create a TOML character sheet for a gnome barbarian' },
  { role: 'assistant', content: '```toml\n', prefix: true }
]);

// With JSON schema constraint
const schema = {
  type: 'object',
  required: ['rating'],
  additionalProperties: false,
  properties: { rating: { type: 'number', minimum: 0, maximum: 5 } }
};
const result = await session.prompt('Rate this: ...', { responseConstraint: schema });
const { rating } = JSON.parse(result);

// With RegExp constraint
const emailRegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const email = await session.prompt('Create a fictional email.', {
  responseConstraint: emailRegExp
});

// With AbortSignal
const controller = new AbortController();
stopButton.onclick = () => controller.abort();
const result = await session.prompt('Write me a poem', { signal: controller.signal });
````

#### `session.promptStreaming(input, options?)`

Returns an **async iterable** stream.

**IMPORTANT: Each chunk is CUMULATIVE — it contains the FULL response text generated so far, NOT just the new tokens.**

```javascript
// Streaming example
const stream = session.promptStreaming('Write me an extra-long poem.');
for await (const chunk of stream) {
  console.log(chunk); // Each `chunk` is the FULL text so far
}

// With AbortSignal
const controller = new AbortController();
stopButton.onclick = () => controller.abort();
const stream = session.promptStreaming('Write me a poem.', { signal: controller.signal });
for await (const chunk of stream) {
  console.log(chunk); // Replace display with `chunk` each time
}
```

**How to handle chunks:**

- Each `chunk` is the COMPLETE response text so far
- To display: REPLACE the previous chunk with the new one
- Do NOT concatenate chunks — that would duplicate text

#### `session.append(messages, options?)`

Adds messages to context without triggering a response.

```javascript
await session.append([
  {
    role: 'user',
    content: [
      { type: 'text', value: "Here's one image." },
      { type: 'image', value: blob }
    ]
  }
]);
```

#### `session.clone(options?)`

Creates a deep copy of the session's state for parallel branching.

```javascript
const freshSession = await session.clone();
const result = await freshSession.prompt(comment);
```

#### `session.destroy()`

Immediately frees model memory. Rejects pending `prompt()` calls and errors active streams with `"AbortError"`.

```javascript
session.destroy();
```

#### `session.measureContextUsage(input, options?)`

Estimates token usage without appending.

```javascript
const usage = await session.measureContextUsage('Hello world');
console.log(usage); // token count
```

## Events

### `"contextoverflow"`

Fired when conversation history is evicted due to context window limits.

```javascript
session.addEventListener('contextoverflow', () => {
  console.log("We've gone past the context window, and some inputs will be dropped!");
});
```

### `"downloadprogress"`

Fired on the `monitor` object during model download. `e.loaded` is 0-1.

```javascript
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});
```

## Error Types

| Error                               | When                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `"AbortError" DOMException`         | Aborted via AbortSignal or `.destroy()`                                                 |
| `"NetworkError" DOMException`       | Download fails                                                                          |
| `"QuotaExceededError" DOMException` | Input too large for remaining context. Has `.requested` and `.contextWindow` properties |
| `RangeError`                        | `temperature < 0` or `topK < 1`                                                         |
| `TypeError`                         | Invalid role, invalid multimodal type, missing responseConstraint                       |
| `SyntaxError`                       | Unsupported responseConstraint, invalid prefix placement                                |
| `NotSupportedError`                 | Unsupported languages, unsupported schema features                                      |

## Tool Use

```javascript
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }],
  expectedInputs: [{ type: 'text' }, { type: 'tool-response' }],
  expectedOutputs: [{ type: 'text' }, { type: 'tool-call' }],
  tools: [
    {
      name: 'getWeather',
      description: 'Get the weather in a location.',
      inputSchema: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      },
      async execute({ location }) {
        const res = await fetch('https://weatherapi.example/?location=' + location);
        return JSON.stringify(await res.json());
      }
    }
  ]
});
```

## Streaming Chunk Behavior — CRITICAL NOTE

**Chrome `promptStreaming()` returns CUMULATIVE chunks.**
Each chunk is the FULL response text generated so far.

```javascript
for await (const chunk of stream) {
  // chunk = "Hello"          (1st iteration)
  // chunk = "Hello world"     (2nd iteration)
  // chunk = "Hello world!"    (3rd iteration)
  // → REPLACE display each time, do NOT concatenate
}
```

**Ollama `/api/chat` streaming returns INCREMENTAL chunks.**
Each chunk is just the NEW text.

```javascript
for await (const chunk of stream) {
  // chunk = "Hello"           (1st iteration)
  // chunk = " world"          (2nd iteration)
  // chunk = "!"               (3rd iteration)
  // → CONCATENATE chunks to build full response
}
```

This means the app MUST handle the two providers differently:

- Chrome: `lastMessage.text = chunk` (replace)
- Ollama: `lastMessage.text += chunk.content` (append)
