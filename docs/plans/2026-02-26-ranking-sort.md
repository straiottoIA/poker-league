# Ranking Sort Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar ordenação interativa ao Ranking All-Time da página de Estatísticas, com pills de seleção acima da tabela e headers clicáveis, ambos com toggle asc/desc.

**Architecture:** Toda a mudança fica em `stats-content.tsx` (Client Component). Dois `useState` controlam `sortKey` e `sortDir`. O array `allTimeStats` é ordenado in-memory antes de ser passado ao `PaginatedTable`. A prop `key` no `PaginatedTable` reseta a paginação ao mudar sort. Nenhum outro arquivo é alterado.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Next.js 16 App Router

---

### Task 1: Adicionar estado de ordenação e lógica de sort

**Files:**
- Modify: `app/estatisticas/stats-content.tsx`

**Contexto:**
O arquivo começa com `"use client";` e já importa React implicitamente via JSX. A função `StatsContent` recebe `allTimeStats: AllTimePlayerStat[]` como prop.

**Step 1: Adicionar imports e tipo auxiliar**

No topo de `stats-content.tsx`, após `"use client";`, adicionar o import do `useState` e definir o tipo:

```tsx
import { useState } from "react";
```

Logo após os imports, antes da interface `StatsContentProps`, adicionar:

```tsx
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
```

**Step 2: Adicionar estado e dados ordenados dentro de `StatsContent`**

Dentro da função `StatsContent`, antes do `return`, adicionar:

```tsx
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
```

**Step 3: Trocar `allTimeStats` por `sorted` no PaginatedTable e adicionar key**

Localizar o `<PaginatedTable<AllTimePlayerStat>` existente e:
- Trocar `data={allTimeStats}` por `data={sorted}`
- Adicionar `key={`${sortKey}-${sortDir}`}` como primeira prop

```tsx
<PaginatedTable<AllTimePlayerStat>
  key={`${sortKey}-${sortDir}`}
  data={sorted}
  ...
```

**Step 4: Verificar tipagem — `AllTimePlayerStat[SortKey]` deve ser `number`**

Todas as 6 chaves (`total_points`, `wins`, `podiums`, `weeks_attended`, `attendance_pct`, `avg_points`) são `number` na interface `AllTimePlayerStat` em `lib/supabase/types.ts`. A operação `a[sortKey] - b[sortKey]` é válida. ✓

---

### Task 2: Adicionar pills de ordenação acima da tabela

**Files:**
- Modify: `app/estatisticas/stats-content.tsx`

**Contexto:**
A seção "Ranking All-Time" começa com um `<div className="mb-4 flex items-center gap-3 ...">` com o título. Os pills devem aparecer entre esse título e o `<PaginatedTable>`.

**Step 1: Inserir o bloco de pills**

Após o `</div>` do título (que contém `♠` e `Ranking All-Time`) e antes do `<PaginatedTable>`, inserir:

```tsx
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
```

---

### Task 3: Tornar os headers de colunas clicáveis

**Files:**
- Modify: `app/estatisticas/stats-content.tsx`

**Contexto:**
Os 6 `<th>` ordenáveis estão dentro do `renderHeader` do `PaginatedTable`. O `<th>` do `#` e do `Jogador` **não** são ordenáveis — manter como estão.

**Step 1: Substituir os 6 `<th>` estáticos por botões clicáveis**

Dentro de `renderHeader`, substituir cada um dos 6 `<th>` de métricas pelo padrão abaixo. Usar `group` no `<th>` para o hover do ícone inativo.

Template para cada header ordenável:
```tsx
<th
  className="px-4 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted group"
>
  <button
    onClick={() => handleSort("SORT_KEY_AQUI")}
    className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-crimson transition-colors"
  >
    {SORT_LABELS["SORT_KEY_AQUI"]}
    <span className={`text-[10px] ${sortKey === "SORT_KEY_AQUI" ? "text-crimson" : "opacity-0 group-hover:opacity-100"}`}>
      {sortKey === "SORT_KEY_AQUI"
        ? sortDir === "desc" ? "▼" : "▲"
        : "↕"}
    </span>
  </button>
</th>
```

Aplicar para as 6 colunas com os respectivos `SortKey`:
- `"total_points"` → coluna "Pontos"
- `"wins"` → coluna "Vitórias"
- `"podiums"` → coluna "Pódios"
- `"weeks_attended"` → coluna "Presenças"
- `"attendance_pct"` → coluna "% Pres."
- `"avg_points"` → coluna "Média"

Os `<th>` de `#` e `Jogador` permanecem sem alteração.

---

### Task 4: Build, review e push

**Step 1: Rodar build**

```bash
cd C:/Users/User/poker-league && npm run build
```

Esperado: saída com `✓ Compiled successfully` sem erros TypeScript.

**Step 2: Commit e push**

```bash
git add app/estatisticas/stats-content.tsx
git commit -m "feat(estatisticas): ordenação do ranking all-time por coluna com toggle asc/desc"
git push
```
