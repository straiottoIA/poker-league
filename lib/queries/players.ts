import { SupabaseClient } from "@supabase/supabase-js";
import { Player } from "@/lib/supabase/types";

export async function getPlayers(supabase: SupabaseClient): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createPlayer(
  supabase: SupabaseClient,
  name: string
): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
}
