import type { Match } from '../types';

export type GrowthStage = 0 | 1 | 2 | 3;

export function getGrowthStage(match: Match): GrowthStage {
  if (match.venue_selected) return 3;
  if (match.date_suggested) return 2;
  if (match.total_messages > 0) return 1;
  return 0;
}
