import { SupabaseClient } from "@supabase/supabase-js";
import { Score, LeaderboardEntry, WeekScore } from "@/lib/supabase/types";

type RawScoreRow = {
  player_id: string;
  points: number;
  attended: boolean;
  players: { name: string } | null;
};

type RawFullScoreRow = RawScoreRow & {
  season_id: string;
  week_number: number;
};

function extractPlayerName(row: RawScoreRow, context: string): string {
  if (!row.players) throw new Error(`Dados do jogador ausentes em ${context} para player_id ${row.player_id}`);
  return row.players.name;
}

export async function getWeekScores(
  supabase: SupabaseClient,
  seasonId: string,
  weekNumber: number
): Promise<WeekScore[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_id, points, attended, players(name)")
    .eq("season_id", seasonId)
    .eq("week_number", weekNumber);
  if (error) throw error;

  return (data as unknown as RawScoreRow[]).map((s) => ({
    player_id: s.player_id,
    player_name: extractPlayerName(s, "getWeekScores"),
    points: s.points,
    attended: s.attended,
  }));
}

export async function upsertScores(
  supabase: SupabaseClient,
  seasonId: string,
  weekNumber: number,
  scores: { player_id: string; points: number; attended: boolean }[]
): Promise<void> {
  const rows = scores.map((s) => ({
    season_id: seasonId,
    player_id: s.player_id,
    week_number: weekNumber,
    points: s.points,
    attended: s.attended,
  }));

  const { error } = await supabase
    .from("scores")
    .upsert(rows, {
      onConflict: "season_id,player_id,week_number",
    });
  if (error) throw error;
}

export async function getLeaderboard(
  supabase: SupabaseClient,
  seasonId: string
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_id, points, attended, players(name)")
    .eq("season_id", seasonId);
  if (error) throw error;

  const playerMap = new Map<
    string,
    { name: string; totalPoints: number; weeksAttended: number }
  >();

  for (const row of data as unknown as RawScoreRow[]) {
    const existing = playerMap.get(row.player_id) ?? {
      name: extractPlayerName(row, "getLeaderboard"),
      totalPoints: 0,
      weeksAttended: 0,
    };
    existing.totalPoints += row.points;
    if (row.attended) existing.weeksAttended += 1;
    playerMap.set(row.player_id, existing);
  }

  return Array.from(playerMap.entries())
    .map(([pid, info], i) => ({
      player_id: pid,
      player_name: info.name,
      total_points: info.totalPoints,
      weeks_attended: info.weeksAttended,
      rank: i + 1,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function getAllSeasonScores(
  supabase: SupabaseClient,
  seasonId: string
): Promise<Score[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("season_id", seasonId)
    .order("week_number");
  if (error) throw error;
  return (data as Score[]) ?? [];
}
