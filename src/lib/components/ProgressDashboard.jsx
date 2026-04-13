import { useMemo } from 'react';
import { loadPlayerData, getCompanionProgress } from '../services/playerStats';
import { ASSISTANTS } from '../utils/constants';

/**
 * Progress Dashboard — Modal showing detailed progress across all companions
 */
function ProgressDashboard({ isOpen, onClose, companionProgress: _companionProgress, selectedCompanionId: _selectedCompanionId }) {
  const playerData = useMemo(() => loadPlayerData(), []);
  const allAchievements = playerData?.achievements || [];
  const unlockedAchievements = allAchievements.filter((a) => a.earnedAt);
  const totalXP = playerData?.totalXP || 0;
  const totalChallenges = playerData?.totalChallenges || 0;

  if (!isOpen) return null;

  return (
    <div className="dashboard-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Progress Dashboard">
      <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h2>📊 Progress Dashboard</h2>
          <button type="button" className="dashboard-close-btn" onClick={onClose} aria-label="Close dashboard">
            ✕
          </button>
        </div>

        <div className="dashboard-content">
          {/* Overview Stats */}
          <section className="dashboard-section overview-section">
            <h3>Overview</h3>
            <div className="overview-stats">
              <div className="stat-card">
                <span className="stat-card-icon">🎯</span>
                <span className="stat-card-value">{totalChallenges}</span>
                <span className="stat-card-label">Challenges Completed</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-icon">⭐</span>
                <span className="stat-card-value">{totalXP}</span>
                <span className="stat-card-label">Total XP</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-icon">🏆</span>
                <span className="stat-card-value">{unlockedAchievements.length}</span>
                <span className="stat-card-label">Achievements</span>
              </div>
            </div>
          </section>

          {/* Companion Progress */}
          <section className="dashboard-section">
            <h3>Companion Progress</h3>
            <CompanionProgressGrid />
          </section>

          {/* Achievements */}
          <section className="dashboard-section">
            <h3>Achievements ({unlockedAchievements.length}/{allAchievements.length})</h3>
            <div className="achievements-grid">
              {allAchievements.map((achievement) => {
                const isUnlocked = !!achievement.earnedAt;
                return (
                  <div key={achievement.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <span className="achievement-card-icon">{achievement.icon}</span>
                    <div className="achievement-card-info">
                      <span className="achievement-card-name">{achievement.name}</span>
                      <span className="achievement-card-desc">{achievement.description}</span>
                      {isUnlocked && (
                        <span className="achievement-card-earned">
                          +{achievement.xpReward} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid showing progress for all companions
 */
function CompanionProgressGrid() {
  const companions = useMemo(() => Object.values(ASSISTANTS), []);

  return (
    <div className="companion-progress-grid">
      {companions.map((companion) => {
        const progress = getCompanionProgress(companion.id);
        return (
          <div key={companion.id} className="companion-progress-card">
            <div className="companion-card-header">
              <span className="companion-card-emoji">{companion.emoji}</span>
              <div className="companion-card-info">
                <span className="companion-card-name">{companion.shortName}</span>
                <span className="companion-card-level">{progress.level || 'Beginner'}</span>
              </div>
            </div>
            <div className="companion-card-stats">
              <div className="mini-stat">
                <span className="mini-stat-label">Sessions</span>
                <span className="mini-stat-value">{progress.sessionsCompleted || 0}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Streak</span>
                <span className="mini-stat-value">
                  {progress.streakDays > 0 ? `🔥 ${progress.streakDays}` : '—'}
                </span>
              </div>
            </div>
            {progress.skills && Object.keys(progress.skills).length > 0 && (
              <div className="companion-skills">
                {Object.entries(progress.skills).slice(0, 3).map(([skill, value]) => (
                  <div key={skill} className="mini-skill-bar">
                    <span className="mini-skill-name">{skill}</span>
                    <div className="mini-skill-track">
                      <div className="mini-skill-fill" style={{ width: `${Math.min(value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProgressDashboard;
