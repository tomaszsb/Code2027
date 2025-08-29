import { ActionLogEntry } from '../types/StateTypes';

export const formatActionDescription = (entry: ActionLogEntry): string => {
  switch (entry.type) {
    case 'dice_roll':
      // Use the unified description that already includes outcomes
      return `🎲 ${entry.description}`;
      
    case 'card_draw':
      if (entry.details?.cardType && entry.details?.cardCount) {
        return `🎴 Drew ${entry.details.cardCount} ${entry.details.cardType} card${entry.details.cardCount > 1 ? 's' : ''}`;
      }
      return entry.description;

    case 'space_effect':
      const cleanDescription = entry.description.replace(/^📍\s*Space Effect:\s*/, '');
      return `⚡ ${cleanDescription}`;
      
    case 'time_effect':
      const cleanTimeDescription = entry.description.replace(/^📍\s*Space Effect:\s*/, '');
      return `⏰ ${cleanTimeDescription}`;

    case 'manual_action':
      return `✋ ${entry.description}`;

    case 'resource_change':
      return `💰 ${entry.description}`;

    case 'space_entry':
      return `📍 ${entry.description}`;
      
    default:
      return entry.description;
  }
};