import { useState, useEffect } from 'react';

/**
 * Right Panel — Persistent widgets next to the chat
 * Shows: Challenge button, progress tracker, achievements, memories, DnD panel
 */
function RightPanel({
  assistant,
  onChallenge,
  companionProgress,
  achievements,
  memories,
  isProcessing
}) {
  const [activeTab, setActiveTab] = useState('progress');
  const [expandedSections, setExpandedSections] = useState({});

  const tabs = [
    { id: 'progress', icon: '📊', label: 'Progress' },
    { id: 'achievements', icon: '🏆', label: 'Achievements' },
    { id: 'memories', icon: '💾', label: 'Memories' }
  ];

  if (assistant?.category === 'gaming') {
    tabs.push({ id: 'dnd', icon: '⚔️', label: 'DnD' });
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="right-panel">
      {/* Challenge Button */}
      <button
        type="button"
        className="challenge-btn-panel"
        onClick={onChallenge}
        disabled={isProcessing}
      >
        🎲 Generate Challenge
      </button>

      {/* Tabs */}
      <div className="right-panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`right-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="right-panel-content">
        {activeTab === 'progress' && <ProgressWidget progress={companionProgress} />}
        {activeTab === 'achievements' && (
          <AchievementsWidget achievements={achievements} />
        )}
        {activeTab === 'memories' && (
          <MemoriesWidget memories={memories} />
        )}
        {activeTab === 'dnd' && <DnDWidget />}
      </div>
    </aside>
  );
}

/**
 * Progress Tracker Widget
 */
function ProgressWidget({ progress = {} }) {
  const {
    sessionsCompleted = 0,
    streakDays = 0,
    level = 'beginner',
    skills = {}
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
function AchievementsWidget({ achievements = [] }) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="widget">
      <h3 className="widget-title">
        🏆 Achievements ({unlocked.length}/{achievements.length})
      </h3>

      {unlocked.length === 0 && (
        <p className="widget-empty">No achievements yet. Complete challenges to unlock them!</p>
      )}

      {unlocked.map((a) => (
        <div key={a.id} className="achievement unlocked">
          <span className="achievement-icon">{a.icon}</span>
          <div className="achievement-info">
            <span className="achievement-name">{a.name}</span>
            <span className="achievement-desc">{a.description}</span>
          </div>
        </div>
      ))}

      {locked.length > 0 && (
        <button
          type="button"
          className="show-locked-btn"
          onClick={() => {}}
        >
          Show Locked ({locked.length})
        </button>
      )}
    </div>
  );
}

/**
 * Saved Memories Widget (key-value store)
 */
function MemoriesWidget({ memories = {} }) {
  const categories = Object.entries(memories);

  if (categories.length === 0) {
    return (
      <div className="widget">
        <h3 className="widget-title">💾 Memories</h3>
        <p className="widget-empty">
          No memories saved yet. Your companion will start remembering things about you as you chat.
        </p>
      </div>
    );
  }

  return (
    <div className="widget">
      <h3 className="widget-title">💾 Memories</h3>
      {categories.map(([category, items]) => (
        <div key={category} className="memory-category">
          <h4 className="memory-category-title">{category}</h4>
          <ul className="memory-list">
            {items.map((item, i) => (
              <li key={i} className="memory-item">{item}</li>
            ))}
          </ul>
        </div>
      ))}
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
