# Design: Ordenação do Ranking All-Time

**Data:** 2026-02-26
**Arquivo afetado:** `app/estatisticas/stats-content.tsx`

---

## Objetivo

Permitir que o usuário ordene a tabela de Ranking All-Time por qualquer uma das 6 colunas de métricas, com suporte a toggle crescente/decrescente.

---

## Estado

Dois `useState` adicionados em `StatsContent`:

```ts
const [sortKey, setSortKey] = useState<SortKey>("total_points");
const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
```

**Tipo auxiliar:**
```ts
type SortKey = "total_points" | "wins" | "podiums" | "weeks_attended" | "attendance_pct" | "avg_points";
```

**Regra de clique (usada tanto pelos pills quanto pelos headers):**
- Coluna diferente da ativa → muda `sortKey`, reseta `sortDir` para `"desc"`
- Mesma coluna ativa → toggle `sortDir` (`"asc"` ↔ `"desc"`)

---

## Componente A — Pills acima da tabela

```
Ordenar por:  [♦ Pontos ▼]  Vitórias  Pódios  Presenças  % Pres.  Média
```

- Row com `overflow-x-auto` para scroll horizontal em mobile
- Pill ativo: `bg-crimson text-white` + ícone `▼` ou `▲`
- Pill inativo: `border border-border-subtle text-muted hover:text-crimson hover:border-crimson`
- Label "Ordenar por:" em font-body text-[10px] uppercase muted

---

## Componente B — Headers clicáveis

As 6 colunas ordenáveis (`Pontos`, `Vitórias`, `Pódios`, `Presenças`, `% Pres.`, `Média`) tornam-se `<button>` dentro do `<th>`:

- Coluna ativa: texto + ícone `▼`/`▲` em crimson
- Colunas inativas: texto normal + ícone `↕` visível apenas no hover (opacity-0 group-hover:opacity-100)
- `cursor-pointer`, sem borda própria (usa o `<th>` como container)

Pills e headers estão **sincronizados** — ambos leem e escrevem no mesmo `sortKey`/`sortDir`.

---

## Ordenação

```ts
const sorted = [...allTimeStats].sort((a, b) => {
  const diff = a[sortKey] - b[sortKey];
  return sortDir === "desc" ? -diff : diff;
});
```

Aplicada antes de passar `data` ao `PaginatedTable`.

---

## Reset de paginação

Uso de `key` prop no `PaginatedTable`:

```tsx
<PaginatedTable key={`${sortKey}-${sortDir}`} data={sorted} ... />
```

Quando sort muda, React remonta o componente automaticamente, resetando o `page` interno para 0. Sem necessidade de levantar o estado de página.

---

## Mapeamento de labels

| `SortKey`         | Label     |
|-------------------|-----------|
| `total_points`    | Pontos    |
| `wins`            | Vitórias  |
| `podiums`         | Pódios    |
| `weeks_attended`  | Presenças |
| `attendance_pct`  | % Pres.   |
| `avg_points`      | Média     |

---

## Escopo

- Apenas o **Ranking All-Time** recebe ordenação (tabela "Por Temporada" não tem métricas comparáveis entre jogadores).
- Nenhuma alteração em `page.tsx`, `paginated-table.tsx`, `lib/queries/stats.ts` ou tipos.
