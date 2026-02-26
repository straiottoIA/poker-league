# Statistics Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir a página de Estatísticas com dados precisos (corrigindo o bug do limit(5000)) e ranking all-time com vitórias, pódios, % de presença, média de pontos e paginação de 10 em 10.

**Architecture:** Nova `lib/queries/stats.ts` faz fetch paginado de todos os scores (batches de 1000 via `.range()`), computa todas as estatísticas em TypeScript server-side, e retorna dados prontos para o page component. Novo `components/paginated-table.tsx` é um client component genérico que gerencia estado de página localmente. A page permanece server component.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Tailwind CSS v4

---

### Task 1: Adicionar tipos em `lib/supabase/types.ts`

**Files:**
- Modify: `lib/supabase/types.ts`

**Step 1: Adicionar os dois novos tipos ao final do arquivo**

```typescript
export interface AllTimePlayerStat {
  player_id: string;
  player_name: string;
  total_points: number;
  weeks_attended: number;
  total_weeks: number;
  attendance_pct: number;
  seasons_played: number;
  wins: number;
  podiums: number;
  avg_points: number;
}

export interface SeasonSummary {
  season_id: string;
  season_name: string;
  is_active: boolean;
  num_weeks: number;
  weeks_played: number;
  total_attendances: number;
  top_player: string | null;
  top_points: number;
}
```

**Step 2: Verificar build**
```bash
npm run build
```
Esperado: build limpo.

**Step 3: Commit**
```bash
git add lib/supabase/types.ts
git commit -m "feat(stats): add AllTimePlayerStat and SeasonSummary types"
```

---

### Task 2: Criar `lib/queries/stats.ts`

**Files:**
- Create: `lib/queries/stats.ts`

**Step 1: Criar o arquivo com o conteúdo completo**

```typescript
import { SupabaseClient } from "@supabase/supabase-js";
import { Season, AllTimePlayerStat, SeasonSummary } from "@/lib/supabase/types";

type RawScore = {
  player_id: string;
  season_id: string;
  week_number: number;
  points: number;
  attended: boolean;
  players: { name: string } | null;
};

async function fetchAllScores(supabase: SupabaseClient): Promise<RawScore[]> {
  const PAGE = 1000;
  const all: RawScore[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("scores")
      .select("player_id, season_id, week_number, points, attended, players(name)")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as RawScore[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export interface EstatisticasData {
  allTimeStats: AllTimePlayerStat[];
  seasonSummaries: SeasonSummary[];
  totalAttendances: number;
  totalWeeksPlayed: number;
}

export async function getEstatisticasData(
  supabase: SupabaseClient,
  seasons: Season[]
): Promise<EstatisticasData> {
  const scores = await fetchAllScores(supabase);

  type PlayerAcc = {
    name: string;
    total_points: number;
    attended_count: number;
    total_score_records: number;
    season_ids: Set<string>;
  };
  const playerAcc = new Map<string, PlayerAcc>();

  type SeasonPlayerAcc = { player_id: string; name: string; points: number };
  const seasonPlayerAcc = new Map<string, SeasonPlayerAcc>();

  for (const s of scores) {
    const name = s.players?.name ?? "?";

    // All-time accumulator
    const existing = playerAcc.get(s.player_id) ?? {
      name,
      total_points: 0,
      attended_count: 0,
      total_score_records: 0,
      season_ids: new Set<string>(),
    };
    existing.total_points += s.points;
    if (s.attended) existing.attended_count += 1;
    existing.total_score_records += 1;
    existing.season_ids.add(s.season_id);
    playerAcc.set(s.player_id, existing);

    // Season-player accumulator (para calcular vitórias/pódios)
    const spKey = `${s.season_id}|${s.player_id}`;
    const spExisting = seasonPlayerAcc.get(spKey) ?? { player_id: s.player_id, name, points: 0 };
    spExisting.points += s.points;
    seasonPlayerAcc.set(spKey, spExisting);
  }

  // Agrupar season-player por season e calcular vitórias/pódios
  const winsMap = new Map<string, number>();
  const podiumsMap = new Map<string, number>();

  const bySeason = new Map<string, SeasonPlayerAcc[]>();
  for (const [key, acc] of seasonPlayerAcc) {
    const seasonId = key.split("|")[0];
    const arr = bySeason.get(seasonId) ?? [];
    arr.push(acc);
    bySeason.set(seasonId, arr);
  }

  for (const [, players] of bySeason) {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    const rank1pts = sorted[0]?.points ?? -1;
    const rank3pts = sorted[2]?.points ?? -1;

    for (const p of sorted) {
      // Vitória: empate no 1º (pontos > 0 para evitar contar temporadas sem dados)
      if (p.points > 0 && p.points === rank1pts) {
        winsMap.set(p.player_id, (winsMap.get(p.player_id) ?? 0) + 1);
      }
      // Pódio: entre os 3 primeiros (com tratamento de empate)
      const inPodium =
        sorted.length >= 3
          ? p.points >= rank3pts && rank3pts > 0
          : p.points > 0;
      if (inPodium) {
        podiumsMap.set(p.player_id, (podiumsMap.get(p.player_id) ?? 0) + 1);
      }
    }
  }

  // Montar AllTimePlayerStat[]
  const allTimeStats: AllTimePlayerStat[] = Array.from(playerAcc.entries())
    .map(([pid, acc]) => ({
      player_id: pid,
      player_name: acc.name,
      total_points: parseFloat(acc.total_points.toFixed(2)),
      weeks_attended: acc.attended_count,
      total_weeks: acc.total_score_records,
      attendance_pct:
        acc.total_score_records > 0
          ? Math.round((acc.attended_count / acc.total_score_records) * 100)
          : 0,
      seasons_played: acc.season_ids.size,
      wins: winsMap.get(pid) ?? 0,
      podiums: podiumsMap.get(pid) ?? 0,
      avg_points:
        acc.attended_count > 0
          ? parseFloat((acc.total_points / acc.attended_count).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  // Montar SeasonSummary[]
  const seasonSummaries: SeasonSummary[] = seasons.map((season) => {
    const seasonScores = scores.filter((s) => s.season_id === season.id);
    const weeksSet = new Set(seasonScores.map((s) => s.week_number));
    const attended = seasonScores.filter((s) => s.attended);

    const perPlayer = new Map<string, { name: string; points: number }>();
    for (const s of seasonScores) {
      const name = s.players?.name ?? "?";
      const cur = perPlayer.get(s.player_id) ?? { name, points: 0 };
      cur.points += s.points;
      perPlayer.set(s.player_id, cur);
    }

    let topPlayer: string | null = null;
    let topPoints = 0;
    for (const [, info] of perPlayer) {
      if (info.points > topPoints) {
        topPoints = info.points;
        topPlayer = info.name;
      }
    }

    return {
      season_id: season.id,
      season_name: season.name,
      is_active: season.is_active,
      num_weeks: season.num_weeks,
      weeks_played: weeksSet.size,
      total_attendances: attended.length,
      top_player: topPlayer,
      top_points: parseFloat(topPoints.toFixed(2)),
    };
  });

  const totalAttendances = scores.filter((s) => s.attended).length;
  const uniqueWeeks = new Set(scores.map((s) => `${s.season_id}-${s.week_number}`));

  return {
    allTimeStats,
    seasonSummaries,
    totalAttendances,
    totalWeeksPlayed: uniqueWeeks.size,
  };
}
```

**Step 2: Verificar build**
```bash
npm run build
```
Esperado: build limpo.

**Step 3: Commit**
```bash
git add lib/queries/stats.ts
git commit -m "feat(stats): add getEstatisticasData with wins/podiums/attendance/pagination"
```

---

### Task 3: Criar `components/paginated-table.tsx`

**Files:**
- Create: `components/paginated-table.tsx`

**Step 1: Criar o arquivo**

```tsx
"use client";
import { useState } from "react";
import type { ReactNode } from "react";

interface PaginatedTableProps<T> {
  data: T[];
  pageSize?: number;
  renderHeader: () => ReactNode;
  renderRow: (item: T, globalIndex: number) => ReactNode;
  emptyMessage?: string;
}

export function PaginatedTable<T>({
  data,
  pageSize = 10,
  renderHeader,
  renderRow,
  emptyMessage = "Nenhum dado encontrado.",
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize);

  if (data.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-border-strong bg-surface">
        <table className="min-w-full">
          <thead>{renderHeader()}</thead>
          <tbody>
            {pageData.map((item, i) => renderRow(item, page * pageSize + i))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="font-body text-sm text-secondary transition-colors hover:text-crimson disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="font-body text-[11px] text-muted">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="font-body text-sm text-secondary transition-colors hover:text-crimson disabled:opacity-30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verificar build**
```bash
npm run build
```

**Step 3: Commit**
```bash
git add components/paginated-table.tsx
git commit -m "feat(stats): add generic PaginatedTable client component"
```

---

### Task 4: Reescrever `app/estatisticas/page.tsx`

**Files:**
- Modify: `app/estatisticas/page.tsx`

**Step 1: Substituir o conteúdo completo do arquivo**

```tsx
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
          renderRow={(s) => (
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
    <div className={`p-8 text-center ${!last ? "border-r border-border-subtle" : ""}`}>
      <p className="font-heading text-[32px] font-bold text-crimson">{value}</p>
      <p className="mt-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
        {label}
      </p>
    </div>
  );
}
```

**Step 2: Verificar build**
```bash
npm run build
```
Esperado: build limpo. Se houver erro de TypeScript no `PaginatedTable<SeasonSummary>` com o `renderRow` sem segundo parâmetro — declarar `renderRow={(s, _i) => ...}`.

**Step 3: Commit**
```bash
git add app/estatisticas/page.tsx
git commit -m "feat(stats): rewrite Estatísticas with wins/podiums/avg/pct and pagination"
```

---

### Task 5: Push e verificação final

**Step 1: Push**
```bash
git push origin master
```

**Step 2: Verificar no browser após deploy do Netlify (~1 min)**

Checklist:
- [ ] Stat bars mostram totais corretos (não limitados a 5000 scores)
- [ ] Ranking All-Time: 182 jogadores, paginados de 10 em 10
- [ ] Colunas Pontos / Vitórias / Pódios / Presenças / % Pres. / Média presentes
- [ ] 1º lugar destacado com badge crimson e fundo tint
- [ ] Botões ← Anterior / Próxima → funcionando, desabilitados nas extremidades
- [ ] Por Temporada: LXXI aparece no topo (ativa), paginada
- [ ] Temporada ativa card mostra LXXI
