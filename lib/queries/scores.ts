import { SupabaseClient } from "@supabase/supabase-js";
import { Score, LeaderboardEntry, WeekScore } from "@/lib/supabase/types";

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
  return (data ?? []).map((s: Record<string, unknown>) => ({
    player_id: s.player_id as string,
    player_name: (s.players as { name: string }).name,
    points: s.points as number,
    attended: s.attended as boolean,
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

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const pid = r.player_id as string;
    const name = (r.players as { name: string }).name;
    const points = Number(r.points);
    const attended = r.attended as boolean;

    const existing = playerMap.get(pid) ?? {
      name,
      totalPoints: 0,
      weeksAttended: 0,
    };
    existing.totalPoints += points;
    if (attended) existing.weeksAttended += 1;
    playerMap.set(pid, existing);
  }

  const entries: LeaderboardEntry[] = Array.from(playerMap.entries())
    .map(([pid, info]) => ({
      player_id: pid,
      player_name: info.name,
      total_points: info.totalPoints,
      weeks_attended: info.weeksAttended,
      rank: 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
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
  return data ?? [];
}
