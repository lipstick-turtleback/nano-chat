import { Router } from 'express';
import { roll, rollCheck } from '../../src/lib/utils/diceRoller.js';

const router = Router();

// Dice rolling endpoint
router.post('/dice/roll', (req, res) => {
  try {
    const { notation, label = '' } = req.body;
    if (!notation) return res.status(400).json({ error: 'Dice notation required' });

    const result = roll(notation, label);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Skill check endpoint
router.post('/dice/check', (req, res) => {
  try {
    const { modifier, dc, label = '' } = req.body;
    if (modifier === undefined || dc === undefined) {
      return res.status(400).json({ error: 'modifier and dc required' });
    }

    const result = rollCheck(modifier, dc, label);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate DnD scene (proxies to Ollama)
router.post('/dnd/scene', async (req, res) => {
  const { storyState, character, previousAction } = req.body;

  const prompt = `Continue the DnD adventure.

CAMPAIGN STATE:
${JSON.stringify(storyState, null, 2)}

CHARACTER: ${character?.name} (${character?.class} Level ${character?.level})
HP: ${character?.hp}/${character?.max_hp}

${previousAction ? `PREVIOUS ACTION: ${previousAction}\n` : ''}

Respond with JSON ONLY:
{
  "narrative": "2-4 sentences describing the scene",
  "situation": "What's happening right now",
  "actions": [
    {"text": "Action A", "type": "combat", "stat": "strength", "dc": 12},
    {"text": "Action B", "type": "exploration", "stat": "dexterity", "dc": 14},
    {"text": "Action C", "type": "social", "stat": "charisma", "dc": 13},
    {"text": "Action D", "type": "creative", "stat": "intelligence", "dc": 15}
  ]
}`;

  try {
    const response = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    try {
      const scene = JSON.parse(data.message.content);
      res.json(scene);
    } catch {
      res.json({ narrative: data.message.content, actions: [] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
