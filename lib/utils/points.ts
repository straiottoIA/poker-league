// lib/utils/points.ts

/**
 * Calculates points for a player based on their finishing position.
 *
 * Formula: score(pos) = K / (pos + 1)
 * Where K = 2 × first-place score
 *
 * For first place: score(1) = K / 2
 * So K = 2 × (K / 2) → We define K based on totalPlayers.
 * Using K = totalPlayers × 2 gives meaningful spread.
 *
 * Example with 10 players (K=20):
 *   1st: 10.00, 2nd: 6.67, 3rd: 5.00, 4th: 4.00, 5th: 3.33, ...
 *
 * @param position - 1-based finishing position (1 = winner)
 * @param totalPlayers - total number of players who attended
 */
export function calculatePoints(position: number, totalPlayers: number): number {
  const K = totalPlayers * 2;
  return Math.round((K / (position + 1)) * 100) / 100;
}
