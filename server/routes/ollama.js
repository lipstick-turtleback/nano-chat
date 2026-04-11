import { Router } from 'express';
import * as ollama from '../services/ollamaService.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const connected = await ollama.checkConnection();
    res.json({ connected, url: process.env.OLLAMA_URL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/models', async (_req, res) => {
  try {
    const models = await ollama.listModels();
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat', (req, res) => {
  ollama.streamChat(req, res);
});

export default router;
