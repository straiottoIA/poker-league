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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">{season.name}</h1>
            {season.is_active && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Ativa
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{season.num_weeks} semanas</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/seasons/${seasonId}/players`}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Gerenciar Elenco
          </Link>
          <Link
            href={`/seasons/${seasonId}/week/1`}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Registrar Pontos
          </Link>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Classificação
        </h2>
        <Leaderboard entries={leaderboard} />
      </section>

      {/* Season Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Grade da Temporada
        </h2>
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
