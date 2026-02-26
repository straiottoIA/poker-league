import { SupabaseClient } from "@supabase/supabase-js";
import { Season, SeasonWithCount } from "@/lib/supabase/types";

export async function getSeasons(
  supabase: SupabaseClient
): Promise<Season[]> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSeason(
  supabase: SupabaseClient,
  id: string
): Promise<Season> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSeason(
  supabase: SupabaseClient,
  name: string,
  numWeeks: number = 10
): Promise<Season> {
  // Create new season first — if this fails, nothing changes in the database
  const { data, error } = await supabase
    .from("seasons")
    .insert({ name, num_weeks: numWeeks, is_active: true })
    .select()
    .single();
  if (error) throw error;

  // Only then deactivate other seasons, excluding the one just created
  await supabase
    .from("seasons")
    .update({ is_active: false })
    .eq("is_active", true)
    .neq("id", data.id);

  return data;
}

export async function deleteSeason(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("seasons").delete().eq("id", id);
  if (error) throw error;
}

type RawSeasonWithCount = Season & {
  season_players: { count: number }[];
};

export async function getSeasonsWithCount(
  supabase: SupabaseClient
): Promise<SeasonWithCount[]> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*, season_players(count)")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RawSeasonWithCount[]).map((s) => ({
    ...s,
    player_count: s.season_players[0]?.count ?? 0,
  }));
}

export async function getActiveSeason(
  supabase: SupabaseClient
): Promise<Season | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
