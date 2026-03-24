import { SupabaseClient } from "@supabase/supabase-js";

type RawCheckinRow = {
  player_id: string;
  players: { name: string } | null;
};

export async function getCurrentWeek(
  supabase: SupabaseClient,
  seasonId: string,
  numWeeks: number
): Promise<number> {
  // Only advance the week when scores have been saved (points > 0).
  // Check-in rows (points = 0, attended = true) signal a game in progress,
  // not a completed week — so we stay on the same week until scores are saved.
  const { data, error } = await supabase
    .from("scores")
    .select("week_number")
    .eq("season_id", seasonId)
    .gt("points", 0)
    .order("week_number", { ascending: false })
    .limit(1);
  if (error) throw error;

  if (!data || data.length === 0) return 1;
  const lastCompletedWeek = data[0].week_number as number;
  // Allow one extra week beyond numWeeks for the Final Table (Mesa Final)
  return Math.min(lastCompletedWeek + 1, numWeeks + 1);
}

export async function checkInPlayer(
  supabase: SupabaseClient,
  seasonId: string,
  playerId: string,
  weekNumber: number
): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .upsert(
      {
        season_id: seasonId,
        player_id: playerId,
        week_number: weekNumber,
        points: 0,
        attended: true,
      },
      { onConflict: "season_id,player_id,week_number" }
    );
  if (error) throw error;
}

export async function uncheckInPlayer(
  supabase: SupabaseClient,
  seasonId: string,
  playerId: string,
  weekNumber: number
): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .upsert(
      {
        season_id: seasonId,
        player_id: playerId,
        week_number: weekNumber,
        points: 0,
        attended: false,
      },
      { onConflict: "season_id,player_id,week_number" }
    );
  if (error) throw error;
}

export interface CheckedInPlayer {
  player_id: string;
  player_name: string;
}

export async function getCheckedInPlayers(
  supabase: SupabaseClient,
  seasonId: string,
  weekNumber: number
): Promise<CheckedInPlayer[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_id, players(name)")
    .eq("season_id", seasonId)
    .eq("week_number", weekNumber)
    .eq("attended", true);
  if (error) throw error;

  return (data as unknown as RawCheckinRow[]).map((row) => {
    if (!row.players) throw new Error(`Dados do jogador ausentes no check-in para player_id ${row.player_id}`);
    return {
      player_id: row.player_id,
      player_name: row.players.name,
    };
  });
}
