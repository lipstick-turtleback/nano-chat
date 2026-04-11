import { Router } from 'express';
import { getChallengeTypes } from '../../src/lib/utils/toolTypes.js';
import { pickRandomThemes } from '../../src/lib/utils/themeEngine.js';

const router = Router();

/**
 * Generate a creative challenge from random themes
 */
router.post('/generate', async (req, res) => {
  const { companionId, themes } = req.body;

  // Pick 2-4 random themes (if not provided)
  const selectedThemes = themes || pickRandomThemes(2 + Math.floor(Math.random() * 3));
  const themeList = selectedThemes.slice(0, 4).join('", "');

  // Pick a random game type
  const gameTypes = getChallengeTypes();
  const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_DEFAULT_MODEL || 'gemma4:31b-cloud';

  const prompts = {
    quiz: `Create a multiple-choice quiz question using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "quiz",
  "title": "Creative Challenge: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "prompt": "A thought-provoking question connecting the themes",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": "Why the correct answer is right and what it teaches",
    "hint": "A helpful hint (optional)"
  }
}

Make it creative, surprising, and genuinely educational.`,

    true_false: `Create 5 true/false statements connecting these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "true_false",
  "title": "True or False: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "statements": [
      { "text": "Interesting statement", "answer": true, "explanation": "Why" },
      { "text": "Interesting statement", "answer": false, "explanation": "Why" },
      { "text": "Interesting statement", "answer": true, "explanation": "Why" },
      { "text": "Interesting statement", "answer": false, "explanation": "Why" },
      { "text": "Interesting statement", "answer": true, "explanation": "Why" }
    ]
  }
}

Make 2-3 true and 2-3 false. Each should be surprising and educational.`,

    fill_blank: `Create a fill-in-the-blanks paragraph connecting these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "fill_blank",
  "title": "Fill in the Blanks: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "text": "A creative paragraph with [BLANK1], [BLANK2], and [BLANK3]",
    "answers": ["answer1", "answer2", "answer3"],
    "explanation": "Why these words matter in context"
  }
}

Use 3 blanks. Make the paragraph interesting and creative.`,

    word_match: `Create a vocabulary matching challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "word_match",
  "title": "Vocabulary Match: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "pairs": [
      { "word": "Sophisticated word 1", "definition": "Clear definition" },
      { "word": "Sophisticated word 2", "definition": "Clear definition" },
      { "word": "Sophisticated word 3", "definition": "Clear definition" },
      { "word": "Sophisticated word 4", "definition": "Clear definition" },
      { "word": "Sophisticated word 5", "definition": "Clear definition" }
    ]
  }
}

Use advanced vocabulary (C1-C2 level). Connect words to the themes.`,

    riddle: `Create a clever riddle connecting these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "riddle",
  "title": "Riddle: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "riddle": "A poetic, cryptic riddle that hints at the answer",
    "answer": "The actual answer",
    "hint": "A helpful but not too obvious hint",
    "explanation": "How the riddle connects to the answer and themes"
  }
}

Make the riddle poetic, clever, and solvable with thought.`,

    word_ladder: `Create a word ladder challenge connecting these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "word_ladder",
  "title": "Word Ladder: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "startWord": "3-5 letter start word",
    "targetWord": "3-5 letter end word (same length as start)",
    "hint": "Optional hint about the connection"
  }
}

Start and target words should be same length. Change one letter at a time.`,

    emoji_pictionary: `Create an emoji pictionary challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "emoji_pictionary",
  "title": "Emoji Pictionary: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "emojis": "🌙🐺🌲🏠",
    "answer": "The word/phrase/movie the emojis represent",
    "hint": "A helpful hint",
    "category": "movies | idioms | phrases | books | songs"
  }
}

Use 4-6 emojis to represent a phrase, idiom, or concept related to the themes.`,

    would_you_rather: `Create a would-you-rather challenge connecting these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "would_you_rather",
  "title": "Would You Rather: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "optionA": "An interesting, thought-provoking option A",
    "optionB": "An equally interesting option B",
    "explanation": "What this reveals about personality and decision-making"
  }
}

Make both options genuinely difficult to choose between.`,

    two_truths_lie: `Create a two truths and a lie challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "two_truths_lie",
  "title": "Two Truths & A Lie: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "statements": [
      { "text": "Surprising fact #1", "isLie": false, "explanation": "Why it's true" },
      { "text": "Surprising-sounding fact #2", "isLie": true, "explanation": "Why it's false" },
      { "text": "Surprising fact #3", "isLie": false, "explanation": "Why it's true" }
    ]
  }
}

Make the lie sound plausible. Make truths surprising.`,

    sequence: `Create a sequence completion challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "sequence",
  "title": "Complete the Sequence: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "sequence": ["item1", "item2", "item3", "___"],
    "answer": "The next item in the sequence",
    "options": ["Wrong option A", "Correct answer", "Wrong option B", "Wrong option C"],
    "correct": 1,
    "explanation": "What the pattern is and why"
  }
}

Create a logical sequence. Make the pattern discoverable but not obvious.`,

    anagram: `Create an anagram challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "anagram",
  "title": "Anagram Challenge: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "scrambled": "scrambled letters of the answer",
    "answer": "The actual word or phrase",
    "hint": "A category or context hint",
    "explanation": "Interesting fact about the word"
  }
}

Use interesting words connected to the themes.`,

    reorder: `Create a sentence reordering challenge using these themes: "${themeList}".

Respond with JSON ONLY:
{
  "game": "reorder",
  "title": "Reorder the Sentence: ${selectedThemes.slice(0, 3).join(', ')}",
  "content": {
    "words": ["word1", "word2", "word3", "word4", "word5", "word6"],
    "correctSentence": "The correct sentence these words form",
    "hint": "Optional grammar or context hint",
    "explanation": "Grammar point or why this sentence structure matters"
  }
}

Use a grammatically interesting sentence related to the themes.
};`
  };

  const prompt = prompts[gameType] || prompts.quiz;

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const content = data.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({
        error: 'Failed to parse challenge JSON from LLM response',
        raw: content.slice(0, 200)
      });
    }

    const challenge = JSON.parse(jsonMatch[0]);
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
