// lib/utils/points.ts

/**
 * Calculates points for a player based on their finishing position.
 * PLACEHOLDER formula — replace with real formula when provided.
 *
 * @param position - 1-based finishing position (1 = winner)
 * @param totalPlayers - total number of players who attended
 */
export function calculatePoints(position: number, totalPlayers: number): number {
  return Math.max(totalPlayers - position + 1, 1);
}
