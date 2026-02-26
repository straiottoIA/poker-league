import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import { getEstatisticasData } from "@/lib/queries/stats";
import { PaginatedTable } from "@/components/paginated-table";
import type { AllTimePlayerStat, SeasonSummary } from "@/lib/supabase/types";

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
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Estatísticas</h1>
      </div>

      {/* Visão Geral */}
      <section>
        <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
          Visão Geral
        </p>
        <div className="grid grid-cols-2 border border-border-strong bg-surface sm:grid-cols-4">
          <StatBar label="Temporadas" value={seasons.length} />
          <StatBar label="Jogadores" value={playersRes.data?.length ?? 0} />
          <StatBar label="Semanas" value={totalWeeksPlayed} />
          <StatBar label="Presenças" value={totalAttendances} last />
        </div>
        {activeSeason && (
          <div className="mt-4 flex items-center justify-between border border-border-subtle border-l-4 border-l-crimson bg-surface px-6 py-4">
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">
                Temporada Ativa
              </p>
              <p className="mt-1 font-heading text-xl font-bold text-ink">{activeSeason.name}</p>
            </div>
            <span className="bg-crimson px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
              {activeSeason.num_weeks} sem.
            </span>
          </div>
        )}
      </section>
      {/* Ranking All-Time */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♠</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Ranking All-Time</h2>
        </div>
        <PaginatedTable<AllTimePlayerStat>
          data={allTimeStats}
          pageSize={10}
          emptyMessage="Nenhuma pontuação registrada ainda."
          renderHeader={() => (
            <tr className="border-b border-border-strong bg-canvas">
              <th className="px-4 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">#</th>
              <th className="px-4 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Pontos</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Vitórias</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Pódios</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Presenças</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">% Pres.</th>
              <th className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Média</th>
            </tr>
          )}
          renderRow={(entry, i) => (
            <tr
              key={entry.player_id}
              className={`border-b border-border-subtle transition-colors hover:bg-canvas/60 ${
                i === 0 ? "bg-tint-crimson-row" : ""
              }`}
            >
              <td className="px-4 py-3.5">
                {i < 3 ? (
                  <span className="bg-crimson px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
                    {i + 1}°
                  </span>
                ) : (
                  <span className="font-body text-sm text-muted">{i + 1}</span>
                )}
              </td>
              <td className="px-4 py-3.5 font-body text-sm font-medium text-ink">
                {entry.player_name}
              </td>
              <td className="px-4 py-3.5 text-right font-heading text-lg font-bold text-crimson">
                {entry.total_points}
              </td>
              <td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
                {entry.wins}
              </td>
              <td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
                {entry.podiums}
              </td>
              <td className="px-4 py-3.5 text-right font-body text-sm text-muted">
                {entry.weeks_attended}
              </td>
              <td className="px-4 py-3.5 text-right font-body text-sm text-muted">
                {entry.attendance_pct}%
              </td>
              <td className="px-4 py-3.5 text-right font-body text-sm text-muted">
                {entry.avg_points}
              </td>
            </tr>
          )}
        />
      </section>
      {/* Por Temporada */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♣</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Por Temporada</h2>
        </div>
        <PaginatedTable<SeasonSummary>
          data={seasonSummaries}
          pageSize={10}
          emptyMessage="Nenhuma temporada encontrada."
          renderHeader={() => (
            <tr className="border-b border-border-strong bg-canvas">
              <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Temporada</th>
              <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Semanas</th>
              <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Presenças</th>
              <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Melhor Jogador</th>
            </tr>
          )}
          renderRow={(s, _i) => (
            <tr
              key={s.season_id}
              className="border-b border-border-subtle transition-colors hover:bg-canvas/60"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm font-medium text-ink">{s.season_name}</span>
                  {s.is_active && (
                    <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
                      Ativa
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-body text-sm text-secondary">
                {s.weeks_played}/{s.num_weeks}
              </td>
              <td className="px-5 py-3.5 text-right font-body text-sm text-secondary">
                {s.total_attendances}
              </td>
              <td className="px-5 py-3.5 font-body text-sm text-ink">
                {s.top_player ? (
                  <>
                    {s.top_player}
                    <span className="ml-2 font-body text-[11px] font-bold text-crimson">
                      {s.top_points} pts
                    </span>
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          )}
        />
      </section>
    </div>
  );
}

function StatBar({
  label,
  value,
  last,
}: {
  label: string;
  value: number;
  last?: boolean;
}) {
  return (
    <div className={`p-8 text-center ${ !last ? "border-r border-border-subtle" : ""}`}>
      <p className="font-heading text-[32px] font-bold text-crimson">{value}</p>
      <p className="mt-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
        {label}
      </p>
    </div>
  );
}