import request from 'supertest';
import app from '../index.js';
import db from '../db.js';

describe('Server Routes', () => {
  afterAll(() => {
    db.close();
  });

  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('port');
    });
  });

  describe('GET /api/ollama/status', () => {
    it('returns Ollama connection status', async () => {
      const res = await request(app).get('/api/ollama/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('connected');
      expect(typeof res.body.connected).toBe('boolean');
    });
  });

  describe('GET /api/ollama/models', () => {
    it('returns model list (empty if no Ollama)', async () => {
      const res = await request(app).get('/api/ollama/models');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Knowledge Store', () => {
    const testKey = 'test_knowledge';
    const testValue = { test: true };

    it('returns empty knowledge for new player', async () => {
      const res = await request(app).get('/api/knowledge/default/Aria');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('knowledge');
    });

    it('stores and retrieves knowledge', async () => {
      // Store
      const postRes = await request(app)
        .post(`/api/knowledge/default/Aria/${testKey}`)
        .send({ value: testValue });
      expect(postRes.status).toBe(200);
      expect(postRes.body).toHaveProperty('success', true);

      // Retrieve
      const getRes = await request(app).get('/api/knowledge/default/Aria');
      expect(getRes.status).toBe(200);
      expect(getRes.body.knowledge[testKey]).toEqual(testValue);
    });

    it('deletes knowledge', async () => {
      const delRes = await request(app).delete(`/api/knowledge/default/Aria/${testKey}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body).toHaveProperty('success', true);

      // Verify deleted
      const getRes = await request(app).get('/api/knowledge/default/Aria');
      expect(getRes.body.knowledge[testKey]).toBeUndefined();
    });
  });

  describe('Chat Sessions', () => {
    let sessionId;

    it('creates a session', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .send({
          companionId: 'Aria',
          messages: [{ src: 'req', text: 'Hello', timestamp: '10:00' }]
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
      sessionId = res.body.sessionId;
    });

    it('updates session messages', async () => {
      const res = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .send({
          messages: [
            { src: 'req', text: 'Hello', timestamp: '10:00' },
            { src: 'resp', text: 'Hi!', timestamp: '10:01' }
          ]
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('closes a session', async () => {
      const res = await request(app)
        .post(`/api/sessions/${sessionId}/close`)
        .send({
          messages: [{ src: 'req', text: 'Hello', timestamp: '10:00' }]
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('lists active sessions', async () => {
      const res = await request(app).get('/api/sessions/active/default');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessions');
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });
  });

  describe('Dice Rolling', () => {
    it('rolls dice with valid notation', async () => {
      const res = await request(app)
        .post('/api/games/dice/roll')
        .send({ notation: '1d20', label: 'Attack' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.total).toBeLessThanOrEqual(20);
      expect(res.body).toHaveProperty('breakdown');
    });

    it('rolls complex dice notation', async () => {
      const res = await request(app).post('/api/games/dice/roll').send({ notation: '2d6+3' });
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(5);
      expect(res.body.total).toBeLessThanOrEqual(15);
    });

    it('rejects invalid notation', async () => {
      const res = await request(app).post('/api/games/dice/roll').send({ notation: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('performs skill check', async () => {
      const res = await request(app).post('/api/games/dice/check').send({ modifier: 5, dc: 15 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('dc', 15);
    });

    it('rejects check without required params', async () => {
      const res = await request(app).post('/api/games/dice/check').send({ modifier: 5 });
      expect(res.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
