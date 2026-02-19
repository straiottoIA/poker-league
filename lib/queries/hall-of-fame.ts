import { SupabaseClient } from "@supabase/supabase-js";

export interface HallEntry {
  id: number;
  season_number: number;
  champion: string;
  runner_up: string;
}

export async function getHallOfFame(
  supabase: SupabaseClient
): Promise<HallEntry[]> {
  const { data, error } = await supabase
    .from("hall_of_fame")
    .select("*")
    .order("season_number", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
