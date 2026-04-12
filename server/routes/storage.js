import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * POST /api/storage/:companionId/batch
 * Set multiple key-value pairs at once
 * (Must be before :key route to avoid matching "batch" as a key)
 */
router.post('/:companionId/batch', (req, res) => {
  const { companionId } = req.params;
  const { data, playerId = 'default' } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Data object is required' });
  }

  try {
    const stmt = db.prepare(
      `INSERT INTO knowledge_store (player_id, companion_id, key, value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(player_id, companion_id, key)
       DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
    );

    const tx = db.transaction((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        stmt.run(playerId, companionId, key, JSON.stringify(value), JSON.stringify(value));
      }
    });

    tx(data);
    res.json({ success: true, keys: Object.keys(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/storage/:companionId/:key
 * Get a value from companion's key-value storage
 */
router.get('/:companionId/:key', (req, res) => {
  const { companionId, key } = req.params;
  const playerId = req.query.playerId || 'default';

  try {
    const row = db
      .prepare(
        `SELECT value, updated_at FROM knowledge_store
         WHERE player_id = ? AND companion_id = ? AND key = ?`
      )
      .get(playerId, companionId, key);

    if (!row) {
      return res.json({ key, value: null, exists: false });
    }

    res.json({
      key,
      value: JSON.parse(row.value),
      updatedAt: row.updated_at,
      exists: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/storage/:companionId?prefix=
 * List all keys for a companion, optionally filtered by prefix
 */
router.get('/:companionId', (req, res) => {
  const { companionId } = req.params;
  const { prefix, playerId = 'default' } = req.query;

  try {
    let query = `SELECT key, value, updated_at FROM knowledge_store
                 WHERE player_id = ? AND companion_id = ?`;
    const params = [playerId, companionId];

    if (prefix) {
      query += ' AND key LIKE ?';
      params.push(`${prefix}%`);
    }

    query += ' ORDER BY key ASC';

    const rows = db.prepare(query).all(...params);
    const data = {};
    for (const row of rows) {
      data[row.key] = JSON.parse(row.value);
    }

    res.json({ companionId, playerId, keys: Object.keys(data), data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/storage/:companionId/:key
 * Set a value in companion's key-value storage
 */
router.post('/:companionId/:key', (req, res) => {
  const { companionId, key } = req.params;
  const { value } = req.body;
  const playerId = req.body.playerId || 'default';

  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Value is required' });
  }

  try {
    db.prepare(
      `INSERT INTO knowledge_store (player_id, companion_id, key, value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(player_id, companion_id, key)
       DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
    ).run(playerId, companionId, key, JSON.stringify(value), JSON.stringify(value));

    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/storage/:companionId/:key
 * Delete a value from companion's key-value storage
 */
router.delete('/:companionId/:key', (req, res) => {
  const { companionId, key } = req.params;
  const playerId = req.query.playerId || 'default';

  try {
    const result = db
      .prepare(
        `DELETE FROM knowledge_store
         WHERE player_id = ? AND companion_id = ? AND key = ?`
      )
      .run(playerId, companionId, key);

    res.json({ success: true, deleted: result.changes > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
