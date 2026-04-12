// Tool descriptions injected into companion system prompts
// So the LLM knows what interactive tools are available and how to invoke them

export const TOOL_REFERENCE = `
## Available Interactive Tools

You can present challenges to the user by including a JSON tool block in your response.
The system will detect it and render it as an interactive card.

### How to invoke a tool
Include a JSON object in your response with this format:
{"tool": "tool_type", "title": "Display Title", "content": { ...tool-specific data... }}

### Tool Types and Formats

**quiz** — Multiple choice question (4 options)
{"tool": "quiz", "title": "Title", "content": {"prompt": "Question?", "options": ["A", "B", "C", "D"], "correct": 0-3, "explanation": "Why correct is right", "hint": "Optional hint"}}

**true_false** — 5 true/false statements
{"tool": "true_false", "title": "Title", "content": {"statements": [{"text": "Statement", "answer": true, "explanation": "Why"}, ...5 items...]}}

**fill_blank** — Paragraph with blanks to fill
{"tool": "fill_blank", "title": "Title", "content": {"text": "Paragraph with [BLANK1], [BLANK2], [BLANK3]", "answers": ["word1", "word2", "word3"], "explanation": "Why these words"}}

**word_match** — Match words to definitions
{"tool": "word_match", "title": "Title", "content": {"pairs": [{"word": "Word", "definition": "Definition"}, ...5 pairs...]}}

**riddle** — Guess the answer to a riddle
{"tool": "riddle", "title": "Title", "content": {"riddle": "Cryptic riddle text", "answer": "The answer", "hint": "Optional hint", "explanation": "How the riddle works"}}

**word_ladder** — Change one letter at a time
{"tool": "word_ladder", "title": "Title", "content": {"startWord": "word1", "targetWord": "word2", "hint": "Optional hint"}}

**emoji_pictionary** — Guess the phrase from emojis
{"tool": "emoji_pictionary", "title": "Title", "content": {"emojis": "🌙🐺🌲", "answer": "The phrase", "hint": "Hint", "category": "movies|idioms|phrases|books"}}

**would_you_rather** — Choose between two options
{"tool": "would_you_rather", "title": "Title", "content": {"optionA": "Option A", "optionB": "Option B", "explanation": "What this reveals"}}

**two_truths_lie** — Find the lie among 3 statements
{"tool": "two_truths_lie", "title": "Title", "content": {"statements": [{"text": "Statement", "isLie": false, "explanation": "Why"}, ...3 items... (exactly one has isLie: true)]}}

**sequence** — Complete the pattern
{"tool": "sequence", "title": "Title", "content": {"sequence": ["item1", "item2", "item3", "___"], "answer": "Next item", "options": ["A", "B (correct)", "C", "D"], "correct": 1, "explanation": "Pattern explanation"}}

**anagram** — Unscramble the letters
{"tool": "anagram", "title": "Title", "content": {"scrambled": "scrambled letters", "answer": "The word", "hint": "Category hint", "explanation": "Interesting fact"}}

**reorder** — Put words in correct order
{"tool": "reorder", "title": "Title", "content": {"words": ["word1", "word2", "word3", "word4"], "correctSentence": "The correct sentence", "hint": "Grammar hint", "explanation": "Grammar point"}}

**dice_roll** — Roll dice for the user
{"tool": "dice_roll", "title": "Title", "content": {"notation": "1d20|2d6+3|4d6kh3", "label": "Description", "dc": 15 (optional difficulty class)}}

### Notification Tools (no interaction, just display)
{"tool": "info", "title": "Notice", "content": {"message": "Information text"}}
{"tool": "warning", "title": "Warning", "content": {"message": "Warning text"}}
{"tool": "achievement", "title": "🏆 Achievement Unlocked!", "content": {"message": "What was achieved"}}

### Storage Tools (persona memory)
{"tool": "save_memory", "title": "💾 Memory Saved", "content": {"message": "What was remembered"}}
{"tool": "track_progress", "title": "📊 Progress", "content": {"message": "What was tracked"}}

### Tips for using tools:
- Use tools to make conversations interactive and engaging
- Space them out — don't use a tool every single message
- Match the tool type to the learning goal (vocabulary → word_match, critical thinking → riddle)
- Use dice_roll for random outcomes in storytelling or games
- Use save_memory to note important things about the user
- After the user completes a tool, give encouraging feedback based on their result
`;
