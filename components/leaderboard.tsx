import { LeaderboardEntry } from "@/lib/supabase/types";

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="bg-crimson px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
        {rank}°
      </span>
    );
  }
  return <span className="font-body text-sm text-muted">{rank}</span>;
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">Nenhuma pontuação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border-strong bg-surface">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border-strong bg-canvas">
            <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">#</th>
            <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
            <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Pontos</th>
            <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Semanas</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.player_id}
              className={`border-b border-border-subtle transition-colors hover:bg-canvas/60 ${
                i === 0 ? "bg-tint-crimson-row" : ""
              }`}
            >
              <td className="px-5 py-3.5">
                <RankCell rank={entry.rank} />
              </td>
              <td className="px-5 py-3.5 font-body text-sm font-medium text-ink">
                {entry.player_name}
              </td>
              <td className="px-5 py-3.5 text-right font-heading text-lg font-bold text-crimson">
                {entry.total_points}
              </td>
              <td className="px-5 py-3.5 text-right font-body text-sm text-muted">
                {entry.weeks_attended}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
