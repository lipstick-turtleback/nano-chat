import { Router } from 'express';
import fs from 'fs';
import * as tts from '../services/ttsService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { text, voiceStyle = 'default' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const { path: audioPath, cached } = await tts.generateSpeech(text, voiceStyle);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-Cached', cached ? 'true' : 'false');
    res.sendFile(audioPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/voices', (_req, res) => {
  res.json(tts.listVoices());
});

export default router;
