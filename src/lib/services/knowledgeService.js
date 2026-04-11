const API = '/api/knowledge';

/**
 * Load knowledge for a companion from server
 */
export async function loadKnowledge(companionId, prefix = '') {
  try {
    const res = await fetch(`${API}/default/${companionId}?prefix=${prefix}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.knowledge || {};
  } catch {
    return {};
  }
}

/**
 * Save knowledge for a companion to server
 */
export async function saveKnowledge(companionId, data) {
  try {
    for (const [key, value] of Object.entries(data)) {
      await fetch(`${API}/default/${companionId}/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
    }
  } catch (err) {
    console.error('Failed to save knowledge:', err);
  }
}

/**
 * Build knowledge context string for system prompt augmentation
 */
export async function buildKnowledgeContext(companionId) {
  const knowledge = await loadKnowledge(companionId);
  if (!knowledge || Object.keys(knowledge).length === 0) return '';

  const parts = [];

  if (knowledge.userProfile) {
    const p = knowledge.userProfile;
    parts.push(`## What You Know About This User`);
    if (p.strengths?.length) parts.push(`- **Strengths:** ${p.strengths.join(', ')}`);
    if (p.weaknesses?.length) parts.push(`- **Areas to work on:** ${p.weaknesses.join(', ')}`);
    if (p.goals?.length) parts.push(`- **Goals:** ${p.goals.join(', ')}`);
    if (p.interests?.length) parts.push(`- **Interests:** ${p.interests.join(', ')}`);
    if (p.level) parts.push(`- **Current level:** ${p.level}`);
    if (p.learningStyle) parts.push(`- **Learning style:** ${p.learningStyle}`);
  }

  if (knowledge.progress) {
    const pr = knowledge.progress;
    parts.push(`## Progress Tracking`);
    if (pr.sessionsCompleted) parts.push(`- Sessions completed: ${pr.sessionsCompleted}`);
    if (pr.streakDays) parts.push(`- Current streak: ${pr.streakDays} days`);
    if (pr.lastTopics?.length) parts.push(`- Recently covered: ${pr.lastTopics.join(', ')}`);
    if (pr.achievements?.length) parts.push(`- Achievements: ${pr.achievements.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return (
    parts.join('\n') +
    '\n\nUse this knowledge to personalise your responses. Reference past progress, celebrate achievements, and adapt to their learning style. Be warm and show you remember them — but NEVER explicitly mention "I see in my notes that..." or reveal your memory system exists. Just naturally remember and adapt.'
  );
}
