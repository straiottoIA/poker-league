# Design — Redesign da Página de Estatísticas

**Data:** 2026-02-26
**Status:** Aprovado

---

## Problema

A página de Estatísticas atual tem dois problemas críticos:

1. **Dados incompletos:** a query usa `.limit(5000)` mas o banco tem 15.539 scores — as estatísticas estão incorretas.
2. **Informações limitadas:** o Ranking All-Time mostra apenas pontos totais, presenças e número de temporadas — sem vitórias, pódios, média ou percentual de presença.

---

## Abordagem de Dados

**Opção escolhida: Queries agregadas no Supabase (Abordagem B)**

Em vez de buscar todos os scores brutos, usar queries pontuais e eficientes:

- `SUM(points) GROUP BY player_id` — pontos totais por jogador
- `COUNT(*) WHERE attended = true GROUP BY player_id` — presenças
- Para vitórias/pódios: buscar totais por `(season_id, player_id)` e calcular ranking no servidor TypeScript

Isso elimina o bug do `.limit(5000)` e torna a página escalável para futuras temporadas.

---

## Estrutura da Página

### Seção 1 — Visão Geral *(sem alterações)*
4 stat bars: Temporadas · Jogadores · Semanas · Presenças
Card de temporada ativa

### Seção 2 — Ranking All-Time *(substituição completa)*

Tabela paginada com 10 linhas por página.

**Colunas:**

| # | Jogador | Pontos | Vitórias | Pódios | Presenças | % Pres. | Média pts |
|---|---------|--------|----------|--------|-----------|---------|-----------|

**Definições:**
- **Pontos** — soma total de pontos em todas as temporadas e semanas
- **Vitórias** — número de temporadas em que o jogador terminou em 1º lugar (maior pontuação total)
- **Pódios** — número de temporadas em que terminou em top 3
- **Presenças** — número de semanas com `attended = true`
- **% Pres.** — `presenças / total_semanas_do_jogador × 100`, onde `total_semanas_do_jogador` = soma de `num_weeks` das temporadas em que participou
- **Média pts** — `pontos_totais / presenças` (0 se sem presenças)
- **Ordenação:** por Pontos totais decrescente

**Observação:** vitórias e pódios são calculados com base em todas as temporadas com dados (I–LXX). A temporada ativa (LXXI) entra no cálculo assim que tiver scores registrados.

### Seção 3 — Por Temporada *(sem alterações estruturais)*

Tabela paginada com 10 linhas por página.

Colunas existentes: Temporada · Semanas · Presenças · Melhor Jogador

---

## Componentes

### `PaginatedTable` (novo, `"use client"`)

Componente reutilizável que recebe:
- `data: T[]` — array completo
- `pageSize: number` — padrão 10
- `renderHeader: () => ReactNode`
- `renderRow: (item: T, globalIndex: number) => ReactNode`

Estado interno: `currentPage` (useState).

Controles de paginação:
```
← Anterior    Página X de Y    Próxima →
```

Usado tanto no Ranking All-Time quanto no Por Temporada.

### `app/estatisticas/page.tsx` (servidor)

Faz as queries agregadas, computa vitórias/pódios em TypeScript, passa dados prontos para os componentes client.

### `lib/queries/stats.ts` (novo)

Funções de query para as estatísticas:
- `getAllTimePlayerStats(supabase)` — retorna array com pontos, presenças, vitórias, pódios, média, % presença por jogador
- `getSeasonSummaries(supabase)` — retorna resumo por temporada (existente, refatorado)

---

## Lógica de Vitórias e Pódios

```
Para cada temporada:
  1. Agregar pontos totais por jogador (scores WHERE season_id = X)
  2. Ordenar por pontos DESC
  3. Posição 1 → +1 vitória para esse jogador
  4. Posições 1, 2, 3 → +1 pódio para esse jogador

Acumular por jogador em um Map<player_id, { wins, podiums }>
```

Empates na mesma posição: ambos os jogadores recebem a contagem (ex: dois empatados em 1º → ambos ganham vitória).

---

## Fora do Escopo

- Ordenação client-side clicando nos headers de coluna
- Página de perfil individual de jogador
- Gráficos ou visualizações
- Filtro por temporada no ranking all-time
