import { SupabaseClient } from "@supabase/supabase-js";
import { Season, SeasonWithCount } from "@/lib/supabase/types";

function fromRoman(s: string): number {
  const vals: Record<string, number> = { I:1,V:5,X:10,L:50,C:100,D:500,M:1000 };
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = vals[s[i]] ?? 0;
    const nxt = vals[s[i+1]] ?? 0;
    n += cur < nxt ? -cur : cur;
  }
  return n;
}

function sortSeasons<T extends Season>(seasons: T[]): T[] {
  return seasons.sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return fromRoman(b.name) - fromRoman(a.name);
  });
}

export async function getSeasons(
  supabase: SupabaseClient
): Promise<Season[]> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*");
  if (error) throw error;
  return sortSeasons(data ?? []);
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
    .select("*, season_players(count)");
  if (error) throw error;
  const mapped = (data as unknown as RawSeasonWithCount[]).map((s) => ({
    ...s,
    player_count: s.season_players[0]?.count ?? 0,
  }));
  return sortSeasons(mapped);
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
