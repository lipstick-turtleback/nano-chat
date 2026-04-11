import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Create or update a chat session
router.post('/', (req, res) => {
  const { playerId = 'default', companionId, messages = [] } = req.body;

  try {
    const result = db
      .prepare(
        `
      INSERT INTO chat_sessions (player_id, companion_id, messages, message_count)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(playerId, companionId, JSON.stringify(messages), messages.length);

    res.json({ sessionId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update session messages
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { messages } = req.body;

  try {
    db.prepare(
      `
      UPDATE chat_sessions
      SET messages = ?, message_count = ?
      WHERE id = ?
    `
    ).run(JSON.stringify(messages), messages.length, id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close a session (mark as ended)
router.post('/:id/close', (req, res) => {
  const { id } = req.params;
  const { messages } = req.body;

  try {
    db.prepare(
      `
      UPDATE chat_sessions
      SET messages = ?, message_count = ?, closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(JSON.stringify(messages), messages.length, id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active (unclosed) sessions for a player
router.get('/active/:playerId', (req, res) => {
  const { playerId } = req.params;

  try {
    const sessions = db
      .prepare(
        `
      SELECT * FROM chat_sessions
      WHERE player_id = ? AND closed_at IS NULL
      ORDER BY created_at DESC
    `
      )
      .all(playerId);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
