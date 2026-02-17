import { SupabaseClient } from "@supabase/supabase-js";
import { Player } from "@/lib/supabase/types";

export async function getSeasonPlayers(
  supabase: SupabaseClient,
  seasonId: string
): Promise<Player[]> {
  const { data, error } = await supabase
    .from("season_players")
    .select("player_id, players(id, name, created_at)")
    .eq("season_id", seasonId);
  if (error) throw error;
  return (data ?? []).map((sp: Record<string, unknown>) => sp.players as unknown as Player).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getEnrolledPlayerIds(
  supabase: SupabaseClient,
  seasonId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("season_players")
    .select("player_id")
    .eq("season_id", seasonId);
  if (error) throw error;
  return (data ?? []).map((sp: { player_id: string }) => sp.player_id);
}

export async function enrollPlayer(
  supabase: SupabaseClient,
  seasonId: string,
  playerId: string
): Promise<void> {
  const { error } = await supabase
    .from("season_players")
    .insert({ season_id: seasonId, player_id: playerId });
  if (error) throw error;
}

export async function unenrollPlayer(
  supabase: SupabaseClient,
  seasonId: string,
  playerId: string
): Promise<void> {
  const { error } = await supabase
    .from("season_players")
    .delete()
    .eq("season_id", seasonId)
    .eq("player_id", playerId);
  if (error) throw error;
}
