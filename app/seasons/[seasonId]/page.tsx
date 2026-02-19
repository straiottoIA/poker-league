import { createClient } from "@/lib/supabase/server";
import { getSeason } from "@/lib/queries/seasons";
import { getSeasonPlayers } from "@/lib/queries/roster";
import { getLeaderboard, getAllSeasonScores } from "@/lib/queries/scores";
import { Leaderboard } from "@/components/leaderboard";
import { SeasonGrid } from "@/components/season-grid";
import Link from "next/link";

export default async function SeasonDashboard({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const supabase = await createClient();

  const [season, players, leaderboard, scores] = await Promise.all([
    getSeason(supabase, seasonId),
    getSeasonPlayers(supabase, seasonId),
    getLeaderboard(supabase, seasonId),
    getAllSeasonScores(supabase, seasonId),
  ]);

  return (
    <div className="space-y-10">
      {/* Dark header panel */}
      <div className="-mx-4 -mt-10 bg-panel px-4 py-12 sm:-mx-6 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">
              Temporada
            </p>
            <h1 className="mt-3 font-heading text-5xl font-bold leading-none text-white">
              {season.name}
            </h1>
            <p className="mt-3 font-body text-sm text-white/40">
              {season.num_weeks} semanas
              {season.is_active && (
                <span className="ml-3 border border-crimson/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-crimson">
                  Ativa
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-3 pb-1">
            <Link
              href={`/seasons/${seasonId}/players`}
              className="border border-white/20 px-5 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-white/60 transition-all hover:border-white/60 hover:text-white"
            >
              Elenco
            </Link>
            <Link
              href={`/seasons/${seasonId}/week/1`}
              className="bg-crimson px-5 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828]"
            >
              Pontuações
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-[rgba(26,26,26,0.12)] pb-3">
          <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">♠</p>
          <h2 className="font-heading text-2xl font-bold text-ink">Classificação</h2>
        </div>
        <Leaderboard entries={leaderboard} />
      </section>

      {/* Season Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-[rgba(26,26,26,0.12)] pb-3">
          <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">♣</p>
          <h2 className="font-heading text-2xl font-bold text-ink">Grade da Temporada</h2>
        </div>
        <SeasonGrid
          seasonId={seasonId}
          players={players}
          scores={scores}
          numWeeks={season.num_weeks}
        />
      </section>
    </div>
  );
}
