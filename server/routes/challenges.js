import { Router } from 'express';

const router = Router();

/**
 * Generate a creative challenge from 3 random themes
 */
router.post('/generate', async (req, res) => {
  const { companionId, themes } = req.body;

  if (!themes || !Array.isArray(themes) || themes.length < 3) {
    return res.status(400).json({ error: 'At least 3 themes required' });
  }

  const themeList = themes.slice(0, 3).join('", "');
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_DEFAULT_MODEL || 'gemma4:31b-cloud';

  const prompt = `Create an engaging interactive quiz using these three themes: "${themeList}".

Choose ONE format:
1. quiz — Multiple choice question with story context
2. true_false — 5 true/false statements
3. fill_blank — Paragraph with 3 blanks to fill
4. word_match — 5 vocabulary words with definitions to match

Respond with JSON ONLY (no other text):

For "quiz" format:
{
  "game": "quiz",
  "title": "Creative Challenge: Theme1, Theme2 & Theme3",
  "content": {
    "prompt": "The question or instruction",
    "options": ["A", "B", "C", "D"],
    "correct": 1,
    "explanation": "Why the correct answer is right",
    "hint": "A helpful hint (optional)"
  }
}

For "true_false" format:
{
  "game": "true_false",
  "title": "True or False: Theme1, Theme2 & Theme3",
  "content": {
    "statements": [
      { "text": "Statement 1", "answer": true, "explanation": "Why" },
      { "text": "Statement 2", "answer": false, "explanation": "Why" },
      { "text": "Statement 3", "answer": true, "explanation": "Why" },
      { "text": "Statement 4", "answer": false, "explanation": "Why" },
      { "text": "Statement 5", "answer": true, "explanation": "Why" }
    ]
  }
}

For "fill_blank" format:
{
  "game": "fill_blank",
  "title": "Fill in the Blanks: Theme1, Theme2 & Theme3",
  "content": {
    "text": "A paragraph with [BLANK1], [BLANK2], [BLANK3]",
    "answers": ["answer1", "answer2", "answer3"],
    "explanation": "Explanation of answers"
  }
}

For "word_match" format:
{
  "game": "word_match",
  "title": "Vocabulary Match: Theme1, Theme2 & Theme3",
  "content": {
    "pairs": [
      { "word": "Word1", "definition": "Definition 1" },
      { "word": "Word2", "definition": "Definition 2" },
      { "word": "Word3", "definition": "Definition 3" },
      { "word": "Word4", "definition": "Definition 4" },
      { "word": "Word5", "definition": "Definition 5" }
    ]
  }
}

Make it creative, surprising, and genuinely educational. Difficulty: intermediate level.`;

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
