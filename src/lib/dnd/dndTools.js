// ═══════════════════════════════════════════
// DnD Tool Definitions
// ═══════════════════════════════════════════

export const DND_TOOL_TYPES = {
  // Narrative tools
  NARRATIVE: 'dnd_narrative',
  DIALOG: 'dnd_dialog',
  QUEST_UPDATE: 'dnd_quest_update',

  // Mechanic tools
  SKILL_CHECK: 'dnd_skill_check',
  COMBAT: 'dnd_combat',
  COMBAT_TURN: 'dnd_combat_turn',
  LOOT: 'dnd_loot',
  REST: 'dnd_rest',
  SHOP: 'dnd_shop',
  LEVELUP: 'dnd_levelup',
  DEATH: 'dnd_death',

  // Notification
  STORY_EVENT: 'dnd_story_event',
  ENCOUNTER: 'dnd_encounter'
};

/**
 * Create a DnD narrative tool
 */
export function narrativeTool(title, description, choices = []) {
  return {
    tool: DND_TOOL_TYPES.NARRATIVE,
    title,
    content: {
      description,
      choices: choices.map((c) => ({
        id: c.id || c.text.toLowerCase().replace(/\s+/g, '_'),
        text: c.text,
        icon: c.icon || '➡️',
        dc: c.dc || null,
        skill: c.skill || null
      }))
    }
  };
}

/**
 * Create a skill check tool
 */
export function skillCheckTool(skillName, dc, description, stat = null) {
  return {
    tool: DND_TOOL_TYPES.SKILL_CHECK,
    title: `${skillName} Check (DC ${dc})`,
    content: {
      skill: skillName,
      dc,
      description,
      stat,
      advantage: false,
      disadvantage: false
    }
  };
}

/**
 * Create a loot tool
 */
export function lootTool(gold, items, xp) {
  return {
    tool: DND_TOOL_TYPES.LOOT,
    title: 'Loot!',
    content: {
      gold,
      items,
      xp,
      claimed: false
    }
  };
}

/**
 * Create a rest tool
 */
export function restTool(type, hpRecovered, maxHp) {
  return {
    tool: DND_TOOL_TYPES.REST,
    title: type === 'short' ? 'Short Rest' : 'Long Rest',
    content: {
      type,
      hpRecovered,
      maxHp,
      hitDiceRecovered: type === 'short' ? 1 : null
    }
  };
}
