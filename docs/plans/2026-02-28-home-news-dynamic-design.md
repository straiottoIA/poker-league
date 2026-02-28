# Design — Notícias Dinâmicas na Home

**Data:** 2026-02-28
**Status:** Aprovado

## Objetivo

Substituir os 3 cards de notícias hardcoded (de 2017) na home page por cards dinâmicos com dados reais da liga.

## Decisões

| Decisão | Escolha |
|---------|---------|
| Conteúdo | Última etapa + último campeão de temporada + líder atual |
| Arquitetura | Server Component — fetches adicionais no page.tsx |
| Componente | Inline no page.tsx (sem novo componente) |
| Queries novas | `getLastWeekSummary` em scores.ts; `getLeaderboard` já existe |

## Cards

### Card 1 — Última Etapa
- **Chip:** `"Sem. [N] · [Nome da Temporada]"`
- **Título:** `"Etapa [N] encerrada"`
- **Corpo:** `"[Jogador] venceu com [P] pontos"`
- **Dados:** nova `getLastWeekSummary(supabase, seasonId)` — busca semana mais recente com scores + top scorer
- **Fallback:** se sem temporada ativa ou sem etapas: título "Liga em pausa", corpo "Aguardando próxima etapa."

### Card 2 — Último Campeão de Temporada
- **Chip:** `"Temporada [Roman]"` (via `toRoman`)
- **Título:** `"[Jogador] é Campeão"`
- **Corpo:** `"Vice-campeão: [Jogador]"`
- **Dados:** `hallEntries[0]` (já carregado na home, zero query extra)
- **Fallback:** se hall_of_fame vazio: chip "Hall da Fama", título "Histórico em construção", corpo "—"

### Card 3 — Líder Atual
- **Chip:** `"Temporada Ativa"`
- **Título:** `"[Jogador] lidera [Nome da Temporada]"`
- **Corpo:** `"[P] pontos na temporada"`
- **Dados:** `getLeaderboard(supabase, activeSeason.id)[0]`
- **Fallback:** se sem temporada ativa: chip "Temporada", título "Sem temporada ativa", corpo "—"

## Data Flow

```
page.tsx (Server Component)
  ├── getSeasons()          — já existente
  ├── getPlayers()          — já existente
  ├── getActiveSeason()     — já existente
  ├── getHallOfFame()       — já existente → hallEntries[0] para Card 2
  ├── getLastWeekSummary()  — NOVA → Card 1
  └── getLeaderboard()      — já existente, reutilizada → Card 1 líder para Card 3
```

## Nova Query: `getLastWeekSummary`

```ts
interface LastWeekSummary {
  weekNumber: number;
  seasonName: string;
  topScorer: { name: string; points: number };
}

async function getLastWeekSummary(
  supabase: SupabaseClient,
  seasonId: string,
  seasonName: string
): Promise<LastWeekSummary | null>
```

Implementação:
1. Busca `max(week_number)` dos scores da temporada ativa
2. Busca todos os scores daquela semana
3. Retorna o jogador com maior `points`

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `lib/queries/scores.ts` — adicionar `getLastWeekSummary` |
| Modificar | `app/page.tsx` — remover `NEWS`, adicionar fetches, montar cards dinâmicos |
