// ═══════════════════════════════════════════
// DnD Prompt Builder
// Builds the complete system prompt for every DnD turn
// ═══════════════════════════════════════════

/**
 * Stat → modifier mapping from character stats
 */
function getStatModifiers(character) {
  const stats = character?.stats || {};
  return {
    STR: Math.floor(((stats.strength || 10) - 10) / 2),
    DEX: Math.floor(((stats.dexterity || 10) - 10) / 2),
    CON: Math.floor(((stats.constitution || 10) - 10) / 2),
    INT: Math.floor(((stats.intelligence || 10) - 10) / 2),
    WIS: Math.floor(((stats.wisdom || 10) - 10) / 2),
    CHA: Math.floor(((stats.charisma || 10) - 10) / 2)
  };
}

/**
 * Format enemy list for the prompt
 */
function formatEnemies(campaign) {
  const enemies = campaign?.combat?.enemies || [];
  if (enemies.length === 0) return 'None';
  return enemies
    .map((e) => `${e.name} (HP: ${e.hp?.current ?? e.hp}/${e.hp?.max ?? e.maxHp ?? e.hp}, AC: ${e.ac})`)
    .join(', ');
}

/**
 * Format character summary
 */
function formatCharacter(character) {
  if (!character) return 'Unknown adventurer';
  const mods = getStatModifiers(character);
  return `${character.name || 'Adventurer'} (${character.className || character.class || 'Fighter'}, Level ${character.level || 1})
  HP: ${character.hp?.current ?? '?'}/${character.hp?.max ?? '?'}
  AC: ${character.ac ?? '?'}
  Stats: STR ${mods.STR >= 0 ? '+' : ''}${mods.STR}, DEX ${mods.DEX >= 0 ? '+' : ''}${mods.DEX}, CON ${mods.CON >= 0 ? '+' : ''}${mods.CON}, INT ${mods.INT >= 0 ? '+' : ''}${mods.INT}, WIS ${mods.WIS >= 0 ? '+' : ''}${mods.WIS}, CHA ${mods.CHA >= 0 ? '+' : ''}${mods.CHA}
  Gold: ${character.gold || 0}
  Inspiration: ${character.inspiration || 0}
  Inventory: ${(character.inventory || []).map((i) => typeof i === 'string' ? i : i.name).join(', ') || 'None'}`;
}

/**
 * Format campaign context
 */
function formatCampaign(campaign) {
  if (!campaign) return 'No campaign data';
  return `- Location: ${campaign.world?.currentLocation || 'Unknown'}
- Character: see below
- Active enemies: ${formatEnemies(campaign)}
- Quest: ${campaign.story?.mainQuest || 'Unknown'}
- Act: ${campaign.act || 1}, Session: ${campaign.session || 1}
- Story flags: ${JSON.stringify(campaign.story?.storyFlags || {})}`;
}

/**
 * Build the complete DnD prompt for the LLM.
 *
 * @param {Object} params
 * @param {string} params.actionText — What the player did
 * @param {string} params.actionId — The action ID (or "custom")
 * @param {boolean} params.customAction — Whether this was a custom action
 * @param {number} params.naturalRoll — The raw d20 (or appropriate die) roll
 * @param {number|null} params.advantageRoll — Second roll if advantage
 * @param {number} params.modifier — Stat modifier + any bonuses
 * @param {number} params.total — Final total after modifiers
 * @param {number} params.dc — Target DC
 * @param {string} params.diceNotation — e.g. "1d20", "1d6", "2d6"
 * @param {boolean} params.isCrit — Natural max on the die
 * @param {boolean} params.isFumble — Natural 1 on the die
 * @param {string[]} params.passiveNotes — Passive skill activations
 * @param {boolean} params.inspirationSpent — Whether inspiration was spent
 * @param {number} params.currentInspiration — Remaining inspiration tokens
 * @param {Object} params.character — Character sheet
 * @param {Object} params.campaign — Campaign state
 * @param {string} params.systemPrompt — Mira's base DM description
 * @returns {string} Complete prompt to send to LLM
 */
export function buildDnDPrompt({
  actionText,
  actionId,
  customAction,
  naturalRoll,
  advantageRoll,
  modifier,
  total,
  dc,
  diceNotation,
  isCrit,
  isFumble,
  passiveNotes,
  inspirationSpent,
  currentInspiration,
  character,
  campaign,
  systemPrompt
}) {
  const result = isCrit
    ? 'CRITICAL SUCCESS'
    : isFumble
      ? 'CRITICAL FAILURE'
      : total >= dc
        ? 'SUCCESS'
        : 'FAILURE';

  const advantageNote = advantageRoll !== null
    ? `- Advantage roll: ${advantageRoll} (took higher: ${Math.max(naturalRoll, advantageRoll)})\n`
    : '';

  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  const passiveStr = passiveNotes && passiveNotes.length > 0
    ? `- Passive bonuses: ${passiveNotes.join('; ')}\n`
    : '';

  const inspNote = inspirationSpent
    ? '✨ They spent an Inspiration token for this roll!\n'
    : '';

  const critFumbleNote = isCrit
    ? '\n🎉 NATURAL 20 — Critical success! Make it spectacular.\n'
    : isFumble
      ? '\n💀 NATURAL 1 — Critical fumble! Make it entertaining.\n'
      : '';

  const inspLeft = currentInspiration === 0
    ? '\nThe player is out of inspiration tokens. They need to earn more through great roleplay!\n'
    : '';

  return `${systemPrompt}

You are Mira, Dungeon Master. You respond with EXACTLY ONE JSON object.
No markdown, no code blocks, no text outside JSON.

The player just took an action.

ACTION: "${actionText}"
Action ID: ${actionId}
${customAction ? 'This was their own creative idea.' : 'They chose from your suggested options.'}
${inspNote}
DICE RESULT:
- Natural roll: ${naturalRoll} on ${diceNotation}
${advantageNote}- Modifier: ${modStr}
${passiveStr}- Total: ${total}
- Target DC: ${dc}
- Result: ${result}${critFumbleNote}

INSPIRATION TOKENS: ${currentInspiration} remaining${inspLeft}

CAMPAIGN CONTEXT:
${formatCampaign(campaign)}

CHARACTER:
${formatCharacter(character)}

YOUR RESPONSE MUST BE EXACTLY THIS JSON STRUCTURE:

{
  "narrative": "2-4 sentences describing the outcome of their action. Be vivid and specific.",
  "enemies": [
    {
      "id": "enemy_id",
      "name": "Enemy Name",
      "hp": { "current": 7, "max": 7 },
      "ac": 15,
      "status": "alive | wounded | defeated | dead",
      "description": "Brief visual description of current state"
    }
  ],
  "environment": {
    "location": "Current location name",
    "lighting": "bright | dim | dark",
    "features": ["visible feature 1", "visible feature 2"],
    "lightingMod": "How lighting/environment affects what the player sees",
    "weather": null,
    "timeOfDay": "night",
    "dangerLevel": 3
  },
  "systemEvents": [
    { "tool": "dnd_xp", "amount": 50, "reason": "Why XP was awarded" },
    { "tool": "dnd_loot", "gold": 8, "items": ["item1"], "xp": 0 },
    { "tool": "dnd_damage", "target": "player", "amount": 3, "source": "counterattack" },
    { "tool": "dnd_inspiration", "amount": 1, "reason": "Creative tactic" },
    { "tool": "dnd_heal", "target": "player", "amount": 5 },
    { "tool": "dnd_flag", "flag": "goblin_defeated", "value": true },
    { "tool": "dnd_quest_update", "id": "q1", "progress": 0.5, "status": "active" },
    { "tool": "dnd_rest", "type": "short", "hpRecovered": 6 }
  ],
  "actions": [
    {
      "id": "unique_action_id",
      "label": "Short action label for button",
      "stat": "STR | DEX | CON | INT | WIS | CHA",
      "dice": "1d20 | 1d6 | 1d8 | 1d12 | 2d6 | 1d10 | 1d4",
      "dc": 12,
      "type": "combat | exploration | social | rest",
      "description": "What this action involves"
    }
  ],
  "customActionHint": "Or describe your own action..."
}

RULES FOR NARRATIVE:
- If total >= DC: Success. Describe vividly.
- If total < DC: Failure or partial success. Make it interesting.
- If natural 20: Critical success — spectacular, extra benefits.
- If natural 1: Critical fumble — entertaining complication.
- If inspiration spent and still failed: partial success.

RULES FOR ACTIONS:
- Provide 4-8 distinct choices
- Mix action types (combat, exploration, social, rest)
- Each action has: stat, dice size, DC
- Rest actions: stat=null, dice=null, dc=null
- Use different dice sizes: 1d20 for important checks, 1d6 for simple tasks, 1d8 for moderate risk, 1d12 for dangerous actions, 2d6 for variable outcomes
- DC scales with story tension
- At least one action should be creative/unusual
- Actions should feel meaningful and different

RULES FOR ENEMIES:
- Update HP after any damage this turn
- Remove defeated enemies or mark status="defeated"
- Add new enemies if they appear in the narrative
- Keep enemy list current and accurate

RULES FOR SYSTEM EVENTS:
- Only include events that actually happened this turn
- dnd_xp: Award XP for defeating enemies or good roleplay
- dnd_loot: Give gold/items from defeated enemies or discoveries
- dnd_damage: Apply damage to player if they failed badly
- dnd_heal: Restore HP from resting, potions, or magic
- dnd_inspiration: Award for creativity/heroism (max 5 tokens)
- dnd_flag: Toggle story flags for narrative progression
- dnd_quest_update: Update quest progress

Respond with JSON ONLY. No markdown wrappers. No code blocks. No text.`;
}

/**
 * Build the INITIAL scene prompt (first scene, no dice roll yet).
 */
export function buildDnDInitialPrompt({ character, campaign, systemPrompt }) {
  return `${systemPrompt}

You are Mira, Dungeon Master. You respond with EXACTLY ONE JSON object.
No markdown, no code blocks, no text outside JSON.

The adventure begins.

CAMPAIGN CONTEXT:
${formatCampaign(campaign)}

CHARACTER:
${formatCharacter(character)}

Create the opening scene. Set the mood, introduce the location, and present 4-8 initial actions.

YOUR RESPONSE MUST BE EXACTLY THIS JSON STRUCTURE:

{
  "narrative": "2-4 sentences setting the opening scene with atmosphere",
  "enemies": [],
  "environment": {
    "location": "Starting location",
    "lighting": "dim",
    "features": ["feature1", "feature2"],
    "lightingMod": "",
    "weather": null,
    "timeOfDay": "night",
    "dangerLevel": 1
  },
  "systemEvents": [],
  "actions": [
    {
      "id": "look_around",
      "label": "Look around carefully",
      "stat": "WIS",
      "dice": "1d6",
      "dc": 8,
      "type": "exploration",
      "description": "Survey your surroundings"
    }
  ],
  "customActionHint": "Or describe your own action..."
}

Provide 4-8 varied actions. At least one should be a rest option.
Use different dice sizes appropriate to each action's risk level.

Respond with JSON ONLY. No markdown wrappers. No code blocks. No text.`;
}
