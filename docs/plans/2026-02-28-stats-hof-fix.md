# Stats & Hall da Fama Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir cálculos de estatísticas (split de vitórias + attendance_pct) e tornar o Hall da Fama da landing page dinâmico (lendo do Supabase em vez de array hardcoded).

**Architecture:** Quatro arquivos modificados em sequência: tipos → query → UI de stats → landing page. Sem novos arquivos. Sem schema changes.

**Tech Stack:** Next.js 16, TypeScript 5, Supabase, Tailwind 4. Sem test framework — verificação via `npm run build` (TypeScript + Next.js build check).

---

## Task 1: Exportar `fromRoman` de `lib/queries/seasons.ts`

O `getSeasons` ordena temporadas por número romano decrescente. O stats.ts precisa reordenar cronologicamente. Para isso, precisa de `fromRoman`.

**Files:**
- Modify: `lib/queries/seasons.ts`

**Step 1: Adicionar `export` à função `fromRoman`**

Em `lib/queries/seasons.ts`, linha 4, mudar:
```ts
// ANTES:
function fromRoman(s: string): number {

// DEPOIS:
export function fromRoman(s: string): number {
```

**Step 2: Verificar build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: build passa sem erros TypeScript.

**Step 3: Commit**

```bash
git add lib/queries/seasons.ts
git commit -m "refactor: export fromRoman utility from seasons query"
```

---

## Task 2: Atualizar tipo `AllTimePlayerStat` em `lib/supabase/types.ts`

**Files:**
- Modify: `lib/supabase/types.ts`

**Step 1: Renomear `wins` → `season_wins` e adicionar `week_wins`**

Localizar a interface `AllTimePlayerStat` (linha ~50) e substituir:

```ts
// ANTES:
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

// DEPOIS:
export interface AllTimePlayerStat {
  player_id: string;
  player_name: string;
  total_points: number;
  weeks_attended: number;
  total_weeks: number;
  attendance_pct: number;
  seasons_played: number;
  season_wins: number;
  week_wins: number;
  podiums: number;
  avg_points: number;
}
```

**Step 2: Verificar build — espera erros de TypeScript**

```bash
npm run build
```
Expected: FALHA — TypeScript vai reclamar de `wins` não existir em `stats.ts` e `stats-content.tsx`. Isso é esperado e confirma que os outros arquivos precisam ser atualizados.

**Step 3: Commit do tipo**

```bash
git add lib/supabase/types.ts
git commit -m "types: rename wins to season_wins and add week_wins to AllTimePlayerStat"
```

---

## Task 3: Reescrever `getEstatisticasData` em `lib/queries/stats.ts`

**Files:**
- Modify: `lib/queries/stats.ts`

**Step 1: Substituir o conteúdo completo de `lib/queries/stats.ts`**

```ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Season, AllTimePlayerStat, SeasonSummary } from "@/lib/supabase/types";
import { fromRoman } from "@/lib/queries/seasons";

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

  // Ordenar temporadas cronologicamente (mais antiga primeiro) para o cálculo de attendance_pct.
  // getSeasons retorna decrescente (ativa primeiro), então precisamos reordenar.
  const seasonsByAge = [...seasons].sort(
    (a, b) => fromRoman(a.name) - fromRoman(b.name)
  );
  const seasonOrderMap = new Map<string, number>(
    seasonsByAge.map((s, i) => [s.id, i])
  );

  // Lista ordenada cronologicamente de todos os slots de semana jogados
  const allWeekSlotSet = new Set<string>();
  for (const s of scores) {
    allWeekSlotSet.add(`${s.season_id}|${s.week_number}`);
  }
  const allWeekSlots = [...allWeekSlotSet].sort((a, b) => {
    const [aSeasonId, aWeekStr] = a.split("|");
    const [bSeasonId, bWeekStr] = b.split("|");
    const seasonDiff =
      (seasonOrderMap.get(aSeasonId) ?? 0) - (seasonOrderMap.get(bSeasonId) ?? 0);
    if (seasonDiff !== 0) return seasonDiff;
    return parseInt(aWeekStr) - parseInt(bWeekStr);
  });

  type PlayerAcc = {
    name: string;
    total_points: number;
    attended_count: number;
    season_ids: Set<string>;
    slot_keys: Set<string>; // todos os (season|week) slots em que o jogador tem registro
  };
  const playerAcc = new Map<string, PlayerAcc>();

  type SeasonPlayerAcc = { player_id: string; name: string; points: number };
  const seasonPlayerAcc = new Map<string, SeasonPlayerAcc>();

  // weekMap: slot → lista de { player_id, points } para calcular vitórias de etapa
  const weekMap = new Map<string, { player_id: string; points: number }[]>();

  for (const s of scores) {
    const name = s.players?.name ?? "?";
    const slotKey = `${s.season_id}|${s.week_number}`;

    // All-time accumulator
    const existing = playerAcc.get(s.player_id) ?? {
      name,
      total_points: 0,
      attended_count: 0,
      season_ids: new Set<string>(),
      slot_keys: new Set<string>(),
    };
    existing.total_points += s.points;
    if (s.attended) existing.attended_count += 1;
    existing.season_ids.add(s.season_id);
    existing.slot_keys.add(slotKey);
    playerAcc.set(s.player_id, existing);

    // Season-player accumulator (para vitórias de temporada e pódios)
    const spKey = `${s.season_id}|${s.player_id}`;
    const spExisting = seasonPlayerAcc.get(spKey) ?? { player_id: s.player_id, name, points: 0 };
    spExisting.points += s.points;
    seasonPlayerAcc.set(spKey, spExisting);

    // Week accumulator (para vitórias de etapa)
    const weekArr = weekMap.get(slotKey) ?? [];
    weekArr.push({ player_id: s.player_id, points: s.points });
    weekMap.set(slotKey, weekArr);
  }

  // Vitórias de etapa (week_wins): maior pontuação em cada (season, week)
  const weekWinsMap = new Map<string, number>();
  for (const [, players] of weekMap) {
    const maxPts = Math.max(...players.map((p) => p.points));
    if (maxPts <= 0) continue;
    for (const p of players) {
      if (p.points === maxPts) {
        weekWinsMap.set(p.player_id, (weekWinsMap.get(p.player_id) ?? 0) + 1);
      }
    }
  }

  // Vitórias de temporada (season_wins) e pódios
  const seasonWinsMap = new Map<string, number>();
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
      if (p.points > 0 && p.points === rank1pts) {
        seasonWinsMap.set(p.player_id, (seasonWinsMap.get(p.player_id) ?? 0) + 1);
      }
      const inPodium =
        sorted.length >= 3
          ? p.points >= rank3pts && rank3pts > 0
          : p.points > 0;
      if (inPodium) {
        podiumsMap.set(p.player_id, (podiumsMap.get(p.player_id) ?? 0) + 1);
      }
    }
  }

  // Montar AllTimePlayerStat[] com attendance_pct corrigido
  const allTimeStats: AllTimePlayerStat[] = Array.from(playerAcc.entries())
    .map(([pid, acc]) => {
      // Encontrar o índice do primeiro slot cronológico do jogador
      let firstSlotIdx = allWeekSlots.length;
      for (let i = 0; i < allWeekSlots.length; i++) {
        if (acc.slot_keys.has(allWeekSlots[i])) {
          firstSlotIdx = i;
          break;
        }
      }
      const total_since_first = allWeekSlots.length - firstSlotIdx;

      return {
        player_id: pid,
        player_name: acc.name,
        total_points: parseFloat(acc.total_points.toFixed(2)),
        weeks_attended: acc.attended_count,
        total_weeks: total_since_first,
        attendance_pct:
          total_since_first > 0
            ? Math.round((acc.attended_count / total_since_first) * 100)
            : 0,
        seasons_played: acc.season_ids.size,
        season_wins: seasonWinsMap.get(pid) ?? 0,
        week_wins: weekWinsMap.get(pid) ?? 0,
        podiums: podiumsMap.get(pid) ?? 0,
        avg_points:
          acc.attended_count > 0
            ? parseFloat((acc.total_points / acc.attended_count).toFixed(2))
            : 0,
      };
    })
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
Expected: FALHA apenas em `stats-content.tsx` (ainda usa `wins`, ainda não tem `week_wins`). `stats.ts` em si deve compilar sem erros.

**Step 3: Commit**

```bash
git add lib/queries/stats.ts
git commit -m "fix: rewrite stats calculations - split wins, fix attendance_pct"
```

---

## Task 4: Atualizar UI de estatísticas em `app/estatisticas/stats-content.tsx`

**Files:**
- Modify: `app/estatisticas/stats-content.tsx`

**Step 1: Atualizar `SortKey` type e `SORT_LABELS`**

Localizar as linhas ~7-21 e substituir:

```ts
// ANTES:
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

// DEPOIS:
type SortKey =
  | "total_points"
  | "season_wins"
  | "week_wins"
  | "podiums"
  | "weeks_attended"
  | "attendance_pct"
  | "avg_points";

const SORT_LABELS: Record<SortKey, string> = {
  total_points: "Pontos",
  season_wins: "Vit. Temp.",
  week_wins: "Vit. Etapa",
  podiums: "Pódios",
  weeks_attended: "Presenças",
  attendance_pct: "% Pres.",
  avg_points: "Média",
};
```

**Step 2: Adicionar `week_wins` no header da tabela**

Localizar o `renderHeader` da `PaginatedTable<AllTimePlayerStat>` (~linha 134) e adicionar `<SortableHeader>` para `week_wins` após `season_wins`:

```tsx
// ANTES (trecho relevante):
<SortableHeader sortKeyVal="wins" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
<SortableHeader sortKeyVal="podiums" ... />

// DEPOIS:
<SortableHeader sortKeyVal="season_wins" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
<SortableHeader sortKeyVal="week_wins" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
<SortableHeader sortKeyVal="podiums" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
```

**Step 3: Adicionar `week_wins` no `renderRow`**

Localizar o `renderRow` (~linha 146) e adicionar `<td>` para `week_wins` após `season_wins`:

```tsx
// ANTES (trecho relevante):
<td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
  {entry.wins}
</td>
<td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
  {entry.podiums}
</td>

// DEPOIS:
<td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
  {entry.season_wins}
</td>
<td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
  {entry.week_wins}
</td>
<td className="px-4 py-3.5 text-right font-body text-sm text-secondary">
  {entry.podiums}
</td>
```

**Step 4: Verificar build**

```bash
npm run build
```
Expected: build passa completamente sem erros TypeScript.

**Step 5: Commit**

```bash
git add app/estatisticas/stats-content.tsx
git commit -m "feat: add week_wins column and update sort keys in stats UI"
```

---

## Task 5: Tornar Hall da Fama dinâmico em `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

**Step 1: Remover array hardcoded e adicionar import + toRoman**

No topo do arquivo, adicionar import:
```ts
import { getHallOfFame } from "@/lib/queries/hall-of-fame";
import type { HallEntry } from "@/lib/queries/hall-of-fame";
```

Remover completamente o array `HALL_OF_FAME` (linhas 7-14).

Adicionar a função `toRoman` logo após os imports (antes do `const NEWS`):
```ts
function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}
```

**Step 2: Adicionar `getHallOfFame` ao `Promise.all` da `LandingPage`**

Localizar o bloco `Promise.all` (~linha 43) e substituir:

```ts
// ANTES:
const [seasons, players, activeSeason] = await Promise.all([
  getSeasons(supabase),
  getPlayers(supabase),
  getActiveSeason(supabase),
]);

// DEPOIS:
const [seasons, players, activeSeason, hallEntries] = await Promise.all([
  getSeasons(supabase),
  getPlayers(supabase),
  getActiveSeason(supabase),
  getHallOfFame(supabase),
]);
// Mostrar apenas as 6 temporadas mais recentes na landing page
const recentHall: HallEntry[] = hallEntries.slice(0, 6);
```

**Step 3: Atualizar o header da tabela Hall da Fama**

Localizar o `<thead>` da tabela Hall da Fama (~linha 203) e mudar a terceira coluna:

```tsx
// ANTES:
<th className="hidden px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted sm:table-cell">
  Destaque
</th>

// DEPOIS:
<th className="hidden px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted sm:table-cell">
  Vice
</th>
```

**Step 4: Substituir o `tbody` da tabela Hall da Fama**

Localizar o bloco `{HALL_OF_FAME.map(...)}` (~linha 215) e substituir por:

```tsx
{recentHall.map((entry, i) => (
  <tr
    key={entry.id}
    className={`border-b border-border-subtle transition-colors hover:bg-canvas/60 ${
      i === 0 ? "bg-tint-crimson-row" : ""
    }`}
  >
    <td className="px-5 py-3.5">
      {i === 0 ? (
        <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold text-white">
          {toRoman(entry.season_number)}
        </span>
      ) : (
        <span className="font-heading text-sm font-bold text-crimson">
          {toRoman(entry.season_number)}
        </span>
      )}
    </td>
    <td className="px-5 py-3.5 font-body text-sm font-medium text-ink">
      {entry.champion}
    </td>
    <td className="hidden px-5 py-3.5 font-body text-xs text-muted sm:table-cell">
      {entry.runner_up}
    </td>
  </tr>
))}
```

**Step 5: Verificar build**

```bash
npm run build
```
Expected: build passa completamente sem erros.

**Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: replace hardcoded Hall da Fama with dynamic Supabase data"
```

---

## Verificação manual pós-deploy

Após rodar `npm run dev`:

1. Acesse `/estatisticas` → confirmar que a tabela tem colunas "Vit. Temp." e "Vit. Etapa" separadas
2. Verificar que `% Pres.` mudou para valores menores para jogadores que entraram tarde na liga
3. Acesse `/` (landing page) → confirmar que a seção Hall da Fama mostra dados do banco (não mais o array estático)
4. Acesse `/hall-da-fama` → confirmar que continua funcionando normalmente

---

## Ação necessária do usuário (fora do código)

Após o deploy, executar no Supabase SQL Editor (projeto `cyibmzxqzcgiqlallvkg`):

```sql
-- Corrigir temporadas 30, 31, 32 (substituir pelos nomes reais dos campeões/vices)
UPDATE hall_of_fame SET champion = 'NOME', runner_up = 'NOME' WHERE season_number = 30;
UPDATE hall_of_fame SET champion = 'NOME', runner_up = 'NOME' WHERE season_number = 31;
UPDATE hall_of_fame SET champion = 'NOME', runner_up = 'NOME' WHERE season_number = 32;

-- Inserir temporadas 33, 34, 35
INSERT INTO hall_of_fame (season_number, champion, runner_up) VALUES
  (33, 'NOME_CAMPEON', 'NOME_VICE'),
  (34, 'NOME_CAMPEON', 'NOME_VICE'),
  (35, 'NOME_CAMPEON', 'NOME_VICE');
```
