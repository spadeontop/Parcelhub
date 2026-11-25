import { CARD_SHADOW } from '../common/cardStyles';

export const HOME_HERO_SHADOW = {
  backgroundColor: '#2563eb',
  shadowColor: '#2563eb',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 18,
  elevation: 4,
} as const;

export const HOME_CARD_SHADOW = CARD_SHADOW;

export const HOME_FAB_SHADOW = {
  shadowColor: '#2563eb',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.34,
  shadowRadius: 14,
  elevation: 8,
} as const;
