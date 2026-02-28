# Design — Gráficos na Página de Estatísticas

**Data:** 2026-02-28
**Status:** Aprovado

## Objetivo

Adicionar 3 gráficos intercalados na página `/estatisticas` para visualização dos dados já existentes, usando Chart.js + react-chartjs-2.

## Decisões

| Decisão | Escolha |
|---------|---------|
| Biblioteca | chart.js + react-chartjs-2 |
| Posicionamento | Seções intercaladas com tabela existente |
| Componentes | Tudo em `StatsContent.tsx` (Abordagem A) |
| Dark mode | `useTheme()` para ajustar cores do Chart.js |

## Gráficos

### 1. Top Jogadores por Pontos
- **Tipo:** Barra horizontal (`Bar` com `indexAxis: 'y'`)
- **Posição:** Acima da tabela sortável
- **Dados:** `allTimeStats`, top 15 por `total_points`
- **Cor:** Crimson (`#e53935`) com opacidade decrescente (1º mais vivo, demais mais suaves)

### 2. Títulos de Temporada
- **Tipo:** Barra horizontal
- **Posição:** Após a tabela sortável
- **Dados:** `allTimeStats` filtrado por `season_wins > 0`, ordenado desc
- **Cor:** Mesmo padrão crimson

### 3. Presenças por Temporada
- **Tipo:** Barra vertical
- **Posição:** Antes dos cards de resumo por temporada
- **Dados:** `seasonSummaries.total_attendances`, ordenado cronologicamente (season_name)
- **Cor:** Crimson; temporada ativa com opacidade reduzida (em andamento)

## Estrutura do StatsContent.tsx

```
[GRÁFICO 1 — Top Pontos]
[Sort buttons + Tabela existente]
[GRÁFICO 2 — Títulos]
[GRÁFICO 3 — Presenças por Temporada]
[Cards de resumo por temporada — existente]
```

## Instalação

```bash
npm install chart.js react-chartjs-2
```

## Notas técnicas

- Registrar apenas os módulos necessários do Chart.js (tree-shaking)
- `responsive: true`, `maintainAspectRatio: false`, container com altura fixa
- Eixos e labels adaptam cor via `useTheme()` (dark: `#8a8a8a`, light: `#999999`)
- Sem SSR: Chart.js usa canvas — componentes com `"use client"` (já é o caso)
