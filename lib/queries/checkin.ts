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
  const { data, error } = await supabase
    .from("scores")
    .select("week_number")
    .eq("season_id", seasonId)
    .order("week_number", { ascending: false })
    .limit(1);
  if (error) throw error;

  if (!data || data.length === 0) return 1;
  const latestWeek = data[0].week_number as number;
  return Math.min(latestWeek + 1, numWeeks);
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
