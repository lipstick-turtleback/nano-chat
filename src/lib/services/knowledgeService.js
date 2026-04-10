// ═══════════════════════════════════════════
// User Knowledge Store — localStorage
// Each companion maintains a background memory of what it knows about the user
// ═══════════════════════════════════════════

const STORAGE_KEY = 'lexichat_knowledge';

/**
 * Load all companion memories from localStorage
 */
export function loadAllKnowledge() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Load a specific companion's knowledge about the user
 */
export function loadKnowledge(companionId) {
  const all = loadAllKnowledge();
  return all[companionId] || null;
}

/**
 * Save knowledge for a specific companion
 */
export function saveKnowledge(companionId, data) {
  try {
    const all = loadAllKnowledge();
    all[companionId] = {
      ...all[companionId],
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save knowledge:', err);
  }
}

/**
 * Build the system prompt augmentation with known user context
 * This is prepended to the companion's system prompt invisibly
 */
export function buildKnowledgeContext(companionId) {
  const knowledge = loadKnowledge(companionId);
  if (!knowledge || !knowledge.userProfile) return '';

  const { userProfile, progress, preferences } = knowledge;

  const parts = [];

  if (userProfile) {
    parts.push(`## What You Know About This User`);
    if (userProfile.strengths?.length) {
      parts.push(`- **Strengths:** ${userProfile.strengths.join(', ')}`);
    }
    if (userProfile.weaknesses?.length) {
      parts.push(`- **Areas to work on:** ${userProfile.weaknesses.join(', ')}`);
    }
    if (userProfile.goals?.length) {
      parts.push(`- **Goals:** ${userProfile.goals.join(', ')}`);
    }
    if (userProfile.interests?.length) {
      parts.push(`- **Interests:** ${userProfile.interests.join(', ')}`);
    }
    if (userProfile.level) {
      parts.push(`- **Current level:** ${userProfile.level}`);
    }
    if (userProfile.learningStyle) {
      parts.push(`- **Learning style:** ${userProfile.learningStyle}`);
    }
    if (userProfile.notes) {
      parts.push(`- **Notes:** ${userProfile.notes}`);
    }
  }

  if (progress) {
    parts.push(`## Progress Tracking`);
    if (progress.sessionsCompleted) {
      parts.push(`- Sessions completed: ${progress.sessionsCompleted}`);
    }
    if (progress.streak) {
      parts.push(`- Current streak: ${progress.streak} days`);
    }
    if (progress.lastTopics?.length) {
      parts.push(`- Recently covered: ${progress.lastTopics.join(', ')}`);
    }
    if (progress.achievements?.length) {
      parts.push(`- Achievements: ${progress.achievements.join(', ')}`);
    }
  }

  if (preferences) {
    parts.push(`## User Preferences`);
    if (preferences.language) {
      parts.push(`- Preferred language: ${preferences.language}`);
    }
    if (preferences.pace) {
      parts.push(`- Preferred pace: ${preferences.pace}`);
    }
    if (preferences.avoidTopics?.length) {
      parts.push(`- Topics to avoid: ${preferences.avoidTopics.join(', ')}`);
    }
  }

  if (parts.length === 0) return '';

  return (
    parts.join('\n') +
    '\n\nUse this knowledge to personalise your responses. Reference past progress, celebrate achievements, and adapt to their learning style. Be warm and show you remember them — but NEVER explicitly mention "I see in my notes that..." or reveal your memory system exists. Just naturally remember and adapt.'
  );
}

/**
 * Generate a knowledge compression prompt
 * The LLM uses this to summarise what it learned about the user
 */
export function createKnowledgeCompressionPrompt(recentMessages) {
  return `Based on the recent conversation, update your knowledge about this user.

Review these messages and identify:
- New strengths demonstrated
- Weaknesses or recurring errors
- Goals or interests mentioned
- Learning preferences or style hints
- Topics they enjoy or struggle with
- Progress milestones

Recent conversation:
${recentMessages.map((m) => `[${m.src}] ${m.text}`).join('\n')}

Respond with a JSON object (nothing else):
{
  "userProfile": {
    "strengths": ["strength1", ...],
    "weaknesses": ["weakness1", ...],
    "goals": ["goal1", ...],
    "interests": ["interest1", ...],
    "level": "estimated level (e.g., B2, C1, beginner, etc.)",
    "learningStyle": "e.g., visual, hands-on, analytical, etc.",
    "notes": "any other relevant observations"
  },
  "progress": {
    "streak": 1,
    "lastTopics": ["topic1", ...],
    "achievements": ["achievement1", ...]
  },
  "preferences": {
    "language": "en",
    "pace": "moderate",
    "avoidTopics": []
  }
}

Only output valid JSON. No other text.`;
}
