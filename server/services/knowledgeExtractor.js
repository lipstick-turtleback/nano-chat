import db from '../db.js';

const EXTRACTION_PROMPT = `Analyze the following chat conversation and extract important information about the user.

CHAT LOG:
{messages}

Respond with ONLY valid JSON:
{
  "userProfile": {
    "strengths": ["skill the user demonstrates"],
    "weaknesses": ["area the user struggles with"],
    "goals": ["what the user wants to achieve"],
    "interests": ["topics they engage with"],
    "level": "estimated proficiency level",
    "learningStyle": "e.g., visual, hands-on, analytical",
    "notes": "any other relevant observations"
  },
  "progress": {
    "sessionsCompleted": 1,
    "streakDays": 1,
    "lastTopics": ["topic1", "topic2"],
    "achievements": ["achievement1"]
  },
  "preferences": {
    "language": "en",
    "pace": "moderate",
    "topicsEnjoyed": ["topic the user liked"],
    "topicsAvoided": ["topic the user skipped"]
  }
}

Be specific. Use examples. Only include confident information. If unsure, omit.`;

/**
 * Extract knowledge from recent chat messages using LLM
 */
export async function extractKnowledge(companionId, messages) {
  if (messages.length < 10) return null;

  const text = messages
    .slice(-50)
    .filter((m) => m.text && m.src !== 'info')
    .map((m) => `[${m.src}] ${m.text}`)
    .join('\n');

  if (!text.trim()) return null;

  const prompt = EXTRACTION_PROMPT.replace('{messages}', text);
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_DEFAULT_MODEL || 'gemma4:31b-cloud';

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.3 }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.message?.content;
    if (!content) return null;

    // Parse JSON from response (may have markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const knowledge = JSON.parse(jsonMatch[0]);
    await saveExtractedKnowledge('default', companionId, knowledge);

    return knowledge;
  } catch {
    return null;
  }
}

/**
 * Save extracted knowledge to database
 */
async function saveExtractedKnowledge(playerId, companionId, knowledge) {
  const stmt = db.prepare(`
    INSERT INTO knowledge_store (player_id, companion_id, key, value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(player_id, companion_id, key)
    DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction(() => {
    for (const [section, data] of Object.entries(knowledge)) {
      if (data && typeof data === 'object') {
        stmt.run(playerId, companionId, section, JSON.stringify(data), JSON.stringify(data));
      }
    }
  });

  tx();
}

/**
 * Check if knowledge extraction is needed and trigger it
 * Called after every message — extracts every N messages
 */
export async function checkAndExtractKnowledge(companionId, messageCount) {
  const interval = parseInt(process.env.KNOWLEDGE_EXTRACT_INTERVAL_MESSAGES || '10', 10);

  if (messageCount % interval !== 0) return null;

  // Get recent messages from the last open session
  const session = db.prepare(`
    SELECT messages FROM chat_sessions
    WHERE companion_id = ? AND closed_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).get(companionId);

  if (!session) return null;

  try {
    const messages = JSON.parse(session.messages);
    return await extractKnowledge(companionId, messages);
  } catch {
    return null;
  }
}
