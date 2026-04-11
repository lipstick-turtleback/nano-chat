import { useState, useEffect } from 'react';

/**
 * Renders notifications for background tools (save_memory, track_progress, etc.)
 * Shows a brief notification that auto-dismisses.
 */
function ToolNotification({ tool, duration = 3000 }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const iconMap = {
    save_memory: '💾',
    track_progress: '📊',
    unlock_achievement: '🏆',
    achievement: '🏆',
    storage_view: '📋',
    storage_set: '💾',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const icon = iconMap[tool.tool] || '📌';
  const title = tool.title || 'Tool Executed';
  const description = tool.content?.message || tool.content?.text || '';

  return (
    <div className={`tool-notification ${fading ? 'fading' : ''}`}>
      <span className="notification-icon">{icon}</span>
      <div className="notification-content">
        <span className="notification-title">{title}</span>
        {description && <span className="notification-desc">{description}</span>}
      </div>
    </div>
  );
}

export default ToolNotification;
