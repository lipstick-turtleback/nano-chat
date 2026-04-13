// ═══════════════════════════════════════════
// DnD State Applier
// Applies system events from LLM response to character/campaign state
// ═══════════════════════════════════════════

/**
 * Apply all system events from an LLM DnD response.
 *
 * @param {Object} response — Parsed DnD response (from parseDnDResponse)
 * @param {Object} state — Current { dndCharacter, dndCampaign }
 * @returns {{ character: Object, campaign: Object, notifications: Array }}
 */
export function applyDnDResponse(response, state) {
  const { dndCharacter, dndCampaign } = state;
  if (!dndCharacter || !dndCampaign) {
    return { character: dndCharacter, campaign: dndCampaign, notifications: [] };
  }

  // Deep clone to avoid mutation
  const char = JSON.parse(JSON.stringify(dndCharacter));
  const campaign = JSON.parse(JSON.stringify(dndCampaign));
  const notifications = [];

  // Apply system events
  const events = response.systemEvents || [];
  for (const event of events) {
    applyEvent(event, char, campaign, notifications);
  }

  // Update enemies from response
  if (response.enemies && Array.isArray(response.enemies)) {
    if (campaign.combat) {
      campaign.combat.enemies = response.enemies.filter(
        (e) => e.status !== 'dead' && e.status !== 'defeated'
      );
    } else if (response.enemies.length > 0) {
      campaign.combat = {
        initiative: [],
        currentTurn: 0,
        round: 1,
        enemies: response.enemies.filter((e) => e.status !== 'dead' && e.status !== 'defeated'),
        log: []
      };
    }
  }

  // Clamp values
  char.hp.current = Math.max(0, Math.min(char.hp.current, char.hp.max));
  char.inspiration = Math.max(0, Math.min(char.inspiration || 0, 5));
  char.gold = Math.max(0, char.gold || 0);
  char.xp = Math.max(0, char.xp || 0);

  return { character: char, campaign, notifications };
}

/**
 * Apply a single system event.
 */
function applyEvent(event, char, campaign, notifications) {
  if (!event || !event.tool) return;

  switch (event.tool) {
    case 'dnd_xp': {
      const amount = event.amount || 0;
      char.xp = (char.xp || 0) + amount;

      // Check level up
      if (char.xp >= char.xpToNext) {
        char.level = (char.level || 1) + 1;
        char.xp -= char.xpToNext;
        char.xpToNext = Math.floor(char.xpToNext * 1.5);
        char.hp.max += 5;
        char.hp.current = char.hp.max;
        notifications.push({
          type: 'achievement',
          message: `🎉 Level Up! You are now level ${char.level}!`
        });
      }

      const reason = event.reason || 'Good roleplay';
      notifications.push({ type: 'xp', message: `⭐ +${amount} XP — ${reason}` });
      break;
    }

    case 'dnd_loot': {
      char.gold = (char.gold || 0) + (event.gold || 0);
      if (event.items && Array.isArray(event.items) && event.items.length > 0) {
        char.inventory = [...(char.inventory || []), ...event.items];
      }
      const lootParts = [];
      if (event.gold) lootParts.push(`+${event.gold} gold`);
      if (event.items?.length) lootParts.push(event.items.join(', '));
      if (event.xp) {
        char.xp = (char.xp || 0) + event.xp;
        lootParts.push(`+${event.xp} XP`);
      }
      if (lootParts.length) {
        notifications.push({ type: 'loot', message: `💰 ${lootParts.join(', ')}` });
      }
      break;
    }

    case 'dnd_damage': {
      if (event.target === 'player') {
        const amount = event.amount || 0;
        const before = char.hp.current;
        char.hp.current = Math.max(0, char.hp.current - amount);
        const source = event.source || 'unknown';

        if (char.hp.current === 0) {
          notifications.push({
            type: 'danger',
            message: `💀 You took ${amount} damage and are unconscious! Death saves begin...`
          });
        } else {
          notifications.push({
            type: 'danger',
            message: `💔 -${amount} HP (${before}→${char.hp.current}) from ${source}`
          });
        }
      }
      break;
    }

    case 'dnd_heal': {
      if (event.target === 'player') {
        const amount = event.amount || 0;
        const before = char.hp.current;
        char.hp.current = Math.min(char.hp.max, char.hp.current + amount);
        notifications.push({
          type: 'info',
          message: `💚 +${amount} HP (${before}→${char.hp.current})`
        });
      }
      break;
    }

    case 'dnd_inspiration': {
      const amount = event.amount || 0;
      char.inspiration = Math.min(5, Math.max(0, (char.inspiration || 0) + amount));
      const reason = event.reason || '';
      notifications.push({
        type: 'inspiration',
        message: `✨ +${amount} Inspiration (${char.inspiration} total)${reason ? ` — ${reason}` : ''}`
      });
      break;
    }

    case 'dnd_flag': {
      if (!campaign.story) campaign.story = {};
      campaign.story.storyFlags = {
        ...campaign.story.storyFlags,
        [event.flag]: event.value
      };
      break;
    }

    case 'dnd_quest_update': {
      const quest = (campaign.story?.sideQuests || []).find((q) => q.id === event.id);
      if (quest) {
        if (event.progress !== undefined) quest.progress = event.progress;
        if (event.status) quest.status = event.status;
        notifications.push({
          type: 'info',
          message: `📋 Quest "${quest.title}" → ${event.status || 'updated'}`
        });
      }
      break;
    }

    case 'dnd_levelup': {
      if (event.newLevel) {
        char.level = event.newLevel;
      }
      if (event.statChanges) {
        if (event.statChanges.hp) {
          char.hp.max += event.statChanges.hp;
          char.hp.current = char.hp.max;
        }
        if (event.statChanges.ac) {
          char.ac = (char.ac || 10) + event.statChanges.ac;
        }
      }
      notifications.push({
        type: 'achievement',
        message: `🎉 Reached level ${char.level}!`
      });
      break;
    }

    case 'dnd_rest': {
      if (event.type === 'short') {
        const hitDice = char.hitDice || 1;
        const conMod = Math.floor(((char.stats?.constitution || 10) - 10) / 2);
        const recovered = Math.max(1, Math.floor(char.hp.max / hitDice) + conMod);
        char.hp.current = Math.min(char.hp.max, char.hp.current + recovered);
        notifications.push({
          type: 'info',
          message: `🏕️ Short rest: +${recovered} HP`
        });
      } else if (event.type === 'long') {
        char.hp.current = char.hp.max;
        notifications.push({
          type: 'info',
          message: `🛏️ Long rest: Full HP restored`
        });
      }
      break;
    }

    case 'dnd_location': {
      if (event.locationId) {
        campaign.world = campaign.world || {};
        campaign.world.currentLocation = event.locationId;
      }
      break;
    }

    case 'dnd_item': {
      if (event.action === 'add' && event.item) {
        char.inventory = [...(char.inventory || []), event.item];
      } else if (event.action === 'remove') {
        char.inventory = (char.inventory || []).filter(
          (item) => item.id !== event.item?.id && item.name !== event.item?.name
        );
      }
      break;
    }

    case 'dnd_condition': {
      if (event.condition && event.duration > 0) {
        char.conditions = char.conditions || [];
        char.conditions.push({
          name: event.condition,
          duration: event.duration,
          target: event.target || 'player'
        });
      }
      break;
    }

    default:
      // Unknown tool — show as generic notification
      if (event.message || event.title) {
        notifications.push({
          type: 'info',
          message: `${event.title || 'Event'}: ${event.message || ''}`
        });
      }
  }
}
