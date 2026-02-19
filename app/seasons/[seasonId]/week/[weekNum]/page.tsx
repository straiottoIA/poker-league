import { createClient } from "@/lib/supabase/server";
import { getSeason } from "@/lib/queries/seasons";
import { getSeasonPlayers } from "@/lib/queries/roster";
import { getWeekScores } from "@/lib/queries/scores";
import { AttendanceScoreForm } from "@/components/attendance-score-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ seasonId: string; weekNum: string }>;
}) {
  const { seasonId, weekNum } = await params;
  const weekNumber = parseInt(weekNum, 10);

  if (isNaN(weekNumber) || weekNumber < 1) {
    notFound();
  }

  const supabase = await createClient();

  const [season, players, existingScores] = await Promise.all([
    getSeason(supabase, seasonId),
    getSeasonPlayers(supabase, seasonId),
    getWeekScores(supabase, seasonId, weekNumber),
  ]);

  if (weekNumber > season.num_weeks) {
    notFound();
  }

  const existingMap = new Map(
    existingScores.map((s) => [s.player_id, s])
  );

  const initialScores = players.map((player) => {
    const existing = existingMap.get(player.id);
    return {
      player_id: player.id,
      player_name: player.name,
      attended: existing?.attended ?? true,
      points: existing?.points ?? 0,
    };
  });

  const prevWeek = weekNumber > 1 ? weekNumber - 1 : null;
  const nextWeek = weekNumber < season.num_weeks ? weekNumber + 1 : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href={`/seasons/${seasonId}`} className="hover:text-slate-900 transition-colors">
              {season.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900">Semana {weekNumber}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Semana {weekNumber}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Registre presença e pontuação de cada jogador.
          </p>
        </div>
        <Link
          href={`/seasons/${seasonId}`}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>

      <AttendanceScoreForm
        seasonId={seasonId}
        weekNumber={weekNumber}
        initialScores={initialScores}
      />

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        {prevWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${prevWeek}`}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Semana {prevWeek}
          </Link>
        ) : (
          <div />
        )}
        {nextWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${nextWeek}`}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            Semana {nextWeek}
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
