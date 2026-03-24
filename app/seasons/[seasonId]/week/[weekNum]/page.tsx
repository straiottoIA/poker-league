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

  if (weekNumber > season.num_weeks + 1) {
    notFound();
  }

  const isFinalTable = weekNumber === season.num_weeks + 1;

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
  const nextWeek = weekNumber <= season.num_weeks ? weekNumber + 1 : null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b-2 border-ink pb-6">
        <div className="flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-muted">
          <Link href={`/seasons/${seasonId}`} className="transition-colors hover:text-ink">
            {season.name}
          </Link>
          <span>/</span>
          <span className="text-ink">{isFinalTable ? "Mesa Final" : `Semana ${weekNumber}`}</span>
        </div>
        <h1 className="mt-3 font-heading text-4xl font-bold text-ink">
          {isFinalTable ? "Mesa Final" : `Semana ${weekNumber}`}
        </h1>
        <p className="mt-2 font-body text-sm text-secondary">
          Registre presença e pontuação de cada jogador.
        </p>
      </div>

      <AttendanceScoreForm
        seasonId={seasonId}
        weekNumber={weekNumber}
        initialScores={initialScores}
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between border-t-2 border-ink pt-6">
        {prevWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${prevWeek}`}
            className="flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-crimson"
          >
            ← Semana {prevWeek}
          </Link>
        ) : (
          <div />
        )}
        <Link
          href={`/seasons/${seasonId}`}
          className="font-body text-[11px] font-bold uppercase tracking-[2px] text-muted transition-colors hover:text-ink"
        >
          Ver Dashboard
        </Link>
        {nextWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${nextWeek}`}
            className="flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-crimson"
          >
            {nextWeek === season.num_weeks + 1 ? "Mesa Final →" : `Semana ${nextWeek} →`}
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
