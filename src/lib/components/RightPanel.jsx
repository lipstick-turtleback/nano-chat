import { useMemo } from 'react';
import { loadPlayerData } from '../services/playerStats';

/**
 * Right Panel — Persistent widgets next to the chat
 * All widgets stacked vertically so everything is visible at a glance
 */
function RightPanel({
  assistant,
  onChallenge,
  companionProgress,
  isProcessing
}) {
  const achievements = useMemo(() => {
    const data = loadPlayerData();
    return data?.achievements || [];
  }, [assistant?.id]);

  return (
    <aside className="right-panel">
      {/* Challenge Button */}
      <button
        type="button"
        className="challenge-btn-panel"
        onClick={onChallenge}
        disabled={isProcessing}
      >
        🎲 Surprise Me
      </button>

      {/* Widgets stacked vertically */}
      <div className="right-panel-widgets">
        <ProgressWidget progress={companionProgress} />
        <AchievementsWidget achievements={achievements} />
        {assistant?.category === 'gaming' && <DnDWidget />}
      </div>
    </aside>
  );
}

/**
 * Progress Tracker Widget
 */
function ProgressWidget({ progress }) {
  if (!progress) {
    return (
      <div className="widget">
        <h3 className="widget-title">📊 Progress</h3>
        <p className="widget-empty">Start chatting to track progress!</p>
      </div>
    );
  }

  const {
    sessionsCompleted = 0,
    streakDays = 0,
    level = 'beginner',
    skills = {},
    totalMessages = 0
  } = progress;

  const skillsList = Object.entries(skills);

  return (
    <div className="widget">
      <h3 className="widget-title">📊 Progress</h3>

      <div className="progress-stats">
        <div className="stat-row">
          <span className="stat-label">Sessions</span>
          <span className="stat-value">{sessionsCompleted}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Streak</span>
          <span className="stat-value">
            {streakDays > 0 ? `🔥 ${streakDays} days` : '—'}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Messages</span>
          <span className="stat-value">{totalMessages}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Level</span>
          <span className="stat-value">{level}</span>
        </div>
      </div>

      {skillsList.length > 0 && (
        <div className="skills-section">
          <h4 className="skills-title">Skills</h4>
          {skillsList.map(([name, value]) => (
            <div key={name} className="skill-bar">
              <span className="skill-name">{name}</span>
              <div className="skill-track">
                <div
                  className="skill-fill"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
              <span className="skill-value">{value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Achievements Widget
 */
function AchievementsWidget({ achievements }) {
  if (!achievements || !Array.isArray(achievements)) {
    return null;
  }

  if (achievements.length === 0) {
    return null;
  }

  const unlocked = achievements.filter((a) => a.earnedAt);
  const locked = achievements.filter((a) => !a.earnedAt);

  return (
    <div className="widget">
      <h3 className="widget-title">🏆 Achievements ({unlocked.length})</h3>

      {unlocked.length === 0 && (
        <p className="widget-empty">Complete challenges to unlock achievements!</p>
      )}

      {unlocked.slice(0, 5).map((a) => (
        <div key={a.id} className="achievement unlocked">
          <span className="achievement-icon">{a.icon}</span>
          <div className="achievement-info">
            <span className="achievement-name">{a.name}</span>
            <span className="achievement-desc">{a.description}</span>
          </div>
        </div>
      ))}

      {unlocked.length > 5 && (
        <p className="widget-empty">+{unlocked.length - 5} more unlocked</p>
      )}
    </div>
  );
}

/**
 * DnD Panel Widget (only for Mira)
 */
function DnDWidget() {
  return (
    <div className="widget">
      <h3 className="widget-title">⚔️ DnD</h3>
      <p className="widget-empty">
        Start a DnD adventure with Mira to see your character sheet, inventory, and quest log here.
      </p>
    </div>
  );
}

export default RightPanel;
