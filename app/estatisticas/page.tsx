import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import { getEstatisticasData } from "@/lib/queries/stats";
import { StatsContent } from "./stats-content";

export default async function EstatisticasPage() {
  const supabase = await createClient();

  const [seasons, playersRes] = await Promise.all([
    getSeasons(supabase),
    supabase.from("players").select("id"),
  ]);

  const activeSeason = seasons.find((s) => s.is_active) ?? null;
  const { allTimeStats, seasonSummaries, totalAttendances, totalWeeksPlayed } =
    await getEstatisticasData(supabase, seasons);

  return (
    <StatsContent
      allTimeStats={allTimeStats}
      seasonSummaries={seasonSummaries}
      activeSeason={activeSeason}
      seasonsCount={seasons.length}
      playersCount={playersRes.data?.length ?? 0}
      totalAttendances={totalAttendances}
      totalWeeksPlayed={totalWeeksPlayed}
    />
  );
}
