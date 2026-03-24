import { Player, Score } from "@/lib/supabase/types";
import { effectivePoints } from "@/lib/utils/points";
import Link from "next/link";

interface SeasonGridProps {
  seasonId: string;
  players: Player[];
  scores: Score[];
  numWeeks: number;
}

export function SeasonGrid({
  seasonId,
  players,
  scores,
  numWeeks,
}: SeasonGridProps) {
  const scoreMap = new Map<string, Score>();
  for (const s of scores) {
    scoreMap.set(`${s.player_id}-${s.week_number}`, s);
  }

  const weeks = Array.from({ length: numWeeks }, (_, i) => i + 1);
  const ftWeek = numWeeks + 1;
  const hasFinalTable = scores.some((s) => s.week_number === ftWeek);

  if (players.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">Nenhum jogador inscrito ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border-strong bg-surface">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border-strong bg-canvas">
            <th className="w-8 px-3 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
              #
            </th>
            <th className="sticky left-0 z-10 bg-canvas px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
              Jogador
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="px-3 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-muted"
              >
                <Link
                  href={`/seasons/${seasonId}/week/${w}`}
                  className="transition-colors hover:text-crimson"
                >
                  S{w}
                </Link>
              </th>
            ))}
            {hasFinalTable && (
              <th className="px-3 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-crimson">
                <Link href={`/seasons/${seasonId}/week/${ftWeek}`} className="transition-colors hover:text-crimson/70">
                  FT
                </Link>
              </th>
            )}
            <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {players
            .map((player) => {
              const attendedPoints = [...weeks, ...(hasFinalTable ? [ftWeek] : [])]
                .map((w) => scoreMap.get(`${player.id}-${w}`))
                .filter((s): s is Score => !!s && s.attended)
                .map((s) => Number(s.points));
              return { player, total: effectivePoints(attendedPoints) };
            })
            .sort((a, b) => b.total - a.total)
            .map(({ player, total }, i) => (
              <tr
                key={player.id}
                className="border-b border-border-subtle transition-colors hover:bg-canvas/40"
              >
                <td className="w-8 px-3 py-2.5 text-center font-body text-xs text-muted">
                  {i + 1}
                </td>
                <td className="sticky left-0 z-10 bg-surface whitespace-nowrap px-5 py-2.5 font-body text-sm font-medium text-ink">
                  {player.name}
                </td>
                {weeks.map((w) => {
                  const score = scoreMap.get(`${player.id}-${w}`);
                  const attended = score?.attended;
                  return (
                    <td
                      key={w}
                      className={`whitespace-nowrap px-3 py-2.5 text-center font-body text-sm ${
                        score
                          ? attended
                            ? "font-bold text-crimson"
                            : "text-secondary"
                          : "text-muted/40"
                      }`}
                    >
                      {score ? +parseFloat(Number(score.points).toFixed(2)) : "–"}
                    </td>
                  );
                })}
                {hasFinalTable && (() => {
                  const ftScore = scoreMap.get(`${player.id}-${ftWeek}`);
                  return (
                    <td key={ftWeek} className={`whitespace-nowrap px-3 py-2.5 text-center font-body text-sm ${ftScore ? ftScore.attended ? "font-bold text-crimson" : "text-secondary" : "text-muted/40"}`}>
                      {ftScore ? +parseFloat(Number(ftScore.points).toFixed(2)) : "–"}
                    </td>
                  );
                })()}
                <td className="whitespace-nowrap px-5 py-2.5 text-right font-heading text-base font-bold text-ink">
                  {+parseFloat(total.toFixed(2))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
