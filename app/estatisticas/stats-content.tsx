"use client";
import { useState } from "react";
import { PaginatedTable } from "@/components/paginated-table";
import type { AllTimePlayerStat, SeasonSummary, Season } from "@/lib/supabase/types";

type SortKey =
  | "total_points"
  | "wins"
  | "podiums"
  | "weeks_attended"
  | "attendance_pct"
  | "avg_points";

const SORT_LABELS: Record<SortKey, string> = {
  total_points: "Pontos",
  wins: "Vitórias",
  podiums: "Pódios",
  weeks_attended: "Presenças",
  attendance_pct: "% Pres.",
  avg_points: "Média",
};

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

interface StatsContentProps {
  allTimeStats: AllTimePlayerStat[];
  seasonSummaries: SeasonSummary[];
  activeSeason: Season | null;
  seasonsCount: number;
  playersCount: number;
  totalAttendances: number;
  totalWeeksPlayed: number;
}

export function StatsContent({
  allTimeStats,
  seasonSummaries,
  activeSeason,
  seasonsCount,
  playersCount,
  totalAttendances,
  totalWeeksPlayed,
}: StatsContentProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...allTimeStats].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

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
          <StatBar label="Temporadas" value={seasonsCount} />
          <StatBar label="Jogadores" value={playersCount} />
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
        {/* Pills de ordenação */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
            Ordenar por:
          </span>
          {SORT_KEYS.map((key) => {
            const active = key === sortKey;
            return (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1 font-body text-[11px] font-bold transition-colors ${
                  active
                    ? "bg-crimson text-white"
                    : "border border-border-subtle text-muted hover:border-crimson hover:text-crimson"
                }`}
              >
                {SORT_LABELS[key]}
                {active && (
                  <span className="text-[10px]">
                    {sortDir === "desc" ? "▼" : "▲"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* key forces remount → resets pagination to page 1 on sort change */}
        <PaginatedTable<AllTimePlayerStat>
          key={`${sortKey}-${sortDir}`}
          data={sorted}
          pageSize={10}
          emptyMessage="Nenhuma pontuação registrada ainda."
          renderHeader={() => (
            <tr className="border-b border-border-strong bg-canvas">
              <th className="px-4 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">#</th>
              <th className="px-4 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
              <SortableHeader sortKeyVal="total_points" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
              <SortableHeader sortKeyVal="wins" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
              <SortableHeader sortKeyVal="podiums" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
              <SortableHeader sortKeyVal="weeks_attended" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
              <SortableHeader sortKeyVal="attendance_pct" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
              <SortableHeader sortKeyVal="avg_points" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
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

function SortableHeader({
  sortKeyVal,
  currentSortKey,
  currentSortDir,
  onSort,
}: {
  sortKeyVal: SortKey;
  currentSortKey: SortKey;
  currentSortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKeyVal === currentSortKey;
  return (
    <th
      className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted group"
      aria-sort={active ? (currentSortDir === "desc" ? "descending" : "ascending") : "none"}
    >
      <button
        onClick={() => onSort(sortKeyVal)}
        className="flex w-full cursor-pointer items-center justify-end gap-1 transition-colors hover:text-crimson"
      >
        {SORT_LABELS[sortKeyVal]}
        <span
          className={`text-[10px] ${active ? "text-crimson" : "opacity-0 group-hover:opacity-100"}`}
        >
          {active ? (currentSortDir === "desc" ? "▼" : "▲") : "↕"}
        </span>
      </button>
    </th>
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
    <div className={`p-8 text-center ${!last ? "border-r border-border-subtle" : ""}`}>
      <p className="font-heading text-[32px] font-bold text-crimson">{value}</p>
      <p className="mt-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
        {label}
      </p>
    </div>
  );
}
