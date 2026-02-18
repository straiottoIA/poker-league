import { SupabaseClient } from "@supabase/supabase-js";
import { Player } from "@/lib/supabase/types";

type RawSeasonPlayer = {
  player_id: string;
  players: { id: string; name: string; created_at: string } | null;
};

export async function getSeasonPlayers(
  supabase: SupabaseClient,
  seasonId: string
): Promise<Player[]> {
  const { data, error } = await supabase
    .from("season_players")
    .select("player_id, players(id, name, created_at)")
    .eq("season_id", seasonId);
  if (error) throw error;

  return (data as RawSeasonPlayer[])
    .map((sp) => {
      if (!sp.players) throw new Error(`Dados do jogador ausentes para season_player ${sp.player_id}`);
      return sp.players;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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
