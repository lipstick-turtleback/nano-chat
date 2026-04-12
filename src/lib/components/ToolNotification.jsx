/**
 * Renders permanent system event notifications in chat.
 * Memories saved, loot acquired, achievements unlocked — these STAY visible.
 */
function ToolNotification({ tool }) {
  const iconMap = {
    save_memory: '💾',
    track_progress: '📊',
    unlock_achievement: '🏆',
    achievement: '🏆',
    storage_view: '📋',
    storage_set: '💾',
    info: 'ℹ️',
    warning: '⚠️',
    dnd_loot: '💰',
    dnd_rest: '🏕️',
    dnd_quest_update: '📜'
  };

  const icon = iconMap[tool.tool] || '📌';
  const title = tool.title || tool.content?.title || 'Event';
  const description = tool.content?.message || tool.content?.text || tool.content?.description || '';

  return (
    <div className="tool-notification system-event">
      <span className="notification-icon">{icon}</span>
      <div className="notification-content">
        <span className="notification-title">{title}</span>
        {description && <span className="notification-desc">{description}</span>}
      </div>
    </div>
  );
}

export default ToolNotification;
