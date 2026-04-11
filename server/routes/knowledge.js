import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Get knowledge for player + companion
router.get('/:playerId/:companionId', (req, res) => {
  const { playerId, companionId } = req.params;
  const { prefix } = req.query;

  try {
    let query =
      'SELECT key, value, updated_at FROM knowledge_store WHERE player_id = ? AND companion_id = ?';
    const params = [playerId, companionId];

    if (prefix) {
      query += ' AND key LIKE ?';
      params.push(`${prefix}%`);
    }

    const rows = db.prepare(query).all(...params);
    const knowledge = {};
    for (const row of rows) {
      knowledge[row.key] = JSON.parse(row.value);
    }

    res.json({ knowledge });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set knowledge value
router.post('/:playerId/:companionId/:key', (req, res) => {
  const { playerId, companionId, key } = req.params;
  const { value } = req.body;

  try {
    db.prepare(
      `
      INSERT INTO knowledge_store (player_id, companion_id, key, value)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(player_id, companion_id, key)
      DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `
    ).run(playerId, companionId, key, JSON.stringify(value), JSON.stringify(value));

    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete knowledge value
router.delete('/:playerId/:companionId/:key', (req, res) => {
  const { playerId, companionId, key } = req.params;

  try {
    db.prepare(
      'DELETE FROM knowledge_store WHERE player_id = ? AND companion_id = ? AND key = ?'
    ).run(playerId, companionId, key);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
