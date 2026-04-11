import CompanionCard from './CompanionCard';
import { ASSISTANTS } from '../utils/constants';

function Sidebar({ selectedAssistantId, onSelect, disabled }) {
  return (
    <aside className="sidebar p-4">
      <h2 className="sidebar-title">Companions</h2>

      <fieldset className="companion-radio-group" aria-label="Select AI companion">
        {Object.values(ASSISTANTS).map((c) => (
          <CompanionCard
            key={c.id}
            assistant={c}
            isActive={c.id === selectedAssistantId}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </fieldset>
    </aside>
  );
}

export default Sidebar;
