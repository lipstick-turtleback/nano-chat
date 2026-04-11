import { useState } from 'react';
import {
  getPlayerKeys,
  getPlayerValue,
  setPlayerValue,
  removePlayerValue
} from '../services/playerStats';

/**
 * Universal Storage Tool — rendered in chat
 * Personas can invoke this to show/edit player data
 * Companion returns JSON:
 * {
 *   "tool": "storage",
 *   "params": {
 *     "action": "list" | "get" | "set" | "delete",
 *     "key": "optional key",
 *     "value": "optional value (for set)",
 *     "prefix": "optional prefix filter (for list)"
 *   }
 * }
 */
function StorageTool({ params, onSubmit }) {
  const { action = 'list', key = '', value = '', prefix = '' } = params;
  const [localAction, setLocalAction] = useState(action);
  const [localKey, setLocalKey] = useState(key);
  const [localValue, setLocalValue] = useState(value);
  const [localPrefix, setLocalPrefix] = useState(prefix);
  const [result, setResult] = useState(null);

  const handleExecute = () => {
    let res;
    switch (localAction) {
      case 'list':
        res = getPlayerKeys(localPrefix);
        setResult({ action: 'list', prefix: localPrefix, data: res });
        break;
      case 'get':
        res = getPlayerValue(localKey, '<not found>');
        setResult({ action: 'get', key: localKey, value: res });
        break;
      case 'set':
        setPlayerValue(localKey, localValue);
        res = getPlayerValue(localKey);
        setResult({ action: 'set', key: localKey, value: res, success: true });
        break;
      case 'delete':
        removePlayerValue(localKey);
        setResult({ action: 'delete', key: localKey, success: true });
        break;
      default:
        setResult({ error: 'Unknown action' });
    }

    onSubmit?.({ action: localAction, key: localKey, result: res });
  };

  return (
    <div className="tool-card storage-tool">
      <div className="tool-card-header">
        <span className="tool-badge">💾</span>
        <h4>Companion Memory</h4>
      </div>

      {!result ? (
        <>
          <div className="storage-actions">
            <select
              className="storage-select"
              value={localAction}
              onChange={(e) => setLocalAction(e.target.value)}
            >
              <option value="list">📋 List Keys</option>
              <option value="get">🔍 Get Value</option>
              <option value="set">✏️ Set Value</option>
              <option value="delete">🗑️ Delete</option>
            </select>
          </div>

          {(localAction === 'get' || localAction === 'set' || localAction === 'delete') && (
            <div className="storage-input-row">
              <label>Key:</label>
              <input
                type="text"
                className="storage-input"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="e.g., Aria.quizScore, dnd.strength"
              />
            </div>
          )}

          {localAction === 'set' && (
            <div className="storage-input-row">
              <label>Value:</label>
              <input
                type="text"
                className="storage-input"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder="Any value"
              />
            </div>
          )}

          {localAction === 'list' && (
            <div className="storage-input-row">
              <label>Prefix (optional):</label>
              <input
                type="text"
                className="storage-input"
                value={localPrefix}
                onChange={(e) => setLocalPrefix(e.target.value)}
                placeholder="e.g., Aria, dnd"
              />
            </div>
          )}

          <button
            type="button"
            className="quiz-submit-btn"
            onClick={handleExecute}
            disabled={
              (localAction !== 'list' && !localKey.trim()) ||
              (localAction === 'set' && !localValue.trim())
            }
          >
            Execute
          </button>
        </>
      ) : result.error ? (
        <div className="storage-error">{result.error}</div>
      ) : (
        <div className="storage-result">
          <div className="storage-result-header">
            <span className="storage-result-icon">
              {result.success ? '✅' : result.action === 'list' ? '📋' : '🔍'}
            </span>
            <strong>
              {result.action === 'list'
                ? 'Keys'
                : result.action === 'get'
                  ? 'Value'
                  : result.action === 'set'
                    ? 'Set'
                    : 'Deleted'}
            </strong>
          </div>

          {result.action === 'list' ? (
            <pre className="storage-data">
              {Object.keys(result.data).length === 0
                ? '(no keys found)'
                : JSON.stringify(result.data, null, 2)}
            </pre>
          ) : result.action === 'delete' ? (
            <p>
              Key <code>{result.key}</code> removed.
            </p>
          ) : (
            <pre className="storage-data">{JSON.stringify(result.value, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default StorageTool;
