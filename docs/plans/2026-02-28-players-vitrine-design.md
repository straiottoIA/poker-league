# Design — Vitrine Pública de Jogadores

**Data:** 2026-02-28
**Status:** Aprovado

## Objetivo

Transformar a página `/players` de uma lista CRUD básica numa vitrine pública em grid de cards, mostrando cada jogador com avatar (iniciais), nome e stats mínimos (pontos totais + vitórias de temporada).

## Decisões

| Decisão | Escolha |
|---------|---------|
| Layout | Grid de cards (2 colunas mobile, 3 desktop) |
| Stats exibidos | Pontos totais + vitórias de temporada |
| Approach | A — server component com join de stats |
| Admin controls | Form add no topo + botão remover no card (só logado) |

## Data Flow

`page.tsx` (Server Component):
1. Fetch paralelo: `getPlayers(supabase)` + `getEstatisticasData(supabase, seasons)`
2. Join por `player_id`: merge `AllTimePlayerStat` nos `Player`s
3. Passa `PlayerWithStats[]` para `PlayerGrid` (client component)

```ts
interface PlayerWithStats {
  id: string;
  name: string;
  total_points: number | null;
  season_wins: number | null;
}
```

Players sem histórico (nenhum score registrado) ficam no grid com `null` → exibido como "—".

## Layout do Card

```
┌─────────────────────────┐
│  [×]          ← remover (só admin, canto direito) │
│                         │
│   ┌──┐                  │
│   │AB│  André Barros    │
│   └──┘                  │
│                         │
│   4.820        7        │
│   PONTOS    VIT. TEMP.  │
└─────────────────────────┘
```

- Avatar: círculo `bg-panel text-white font-heading`, iniciais 2 letras
- Nome: `font-heading font-bold text-ink`
- Stats: 2 colunas, pontos em `text-crimson font-heading text-2xl`, label em `text-[10px] uppercase tracking-[2px] text-muted`
- Card: `bg-surface border border-border-subtle`, hover sutil

## Admin Controls

- **Adicionar:** input + botão no topo, visível só se `isLoggedIn`
- **Remover:** botão "×" no canto superior direito do card, visível só se `isLoggedIn`, confirma via `ConfirmDialog` existente

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `app/players/page.tsx` |
| Substituir | `components/player-list.tsx` → `components/player-grid.tsx` |
