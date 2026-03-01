# Design — Check-in + Lançamento de Colocações Integrado

**Data:** 2026-02-28
**Status:** Aprovado

## Objetivo

Unificar o check-in e o lançamento de pontuação final numa única tela, eliminando a necessidade de planilha externa para registrar colocações.

## Decisões

| Decisão | Escolha |
|---------|---------|
| Página | `/check-in` existente — sem nova rota |
| Componente | `components/check-in-form.tsx` — adicionar seção de colocações |
| Ordenação | Campo numérico por jogador (opção B escolhida pelo usuário) |
| Empates | Não existem — posições são sempre únicas |
| Fórmula de pontos | Placeholder `calculatePoints(position, total)` — trocar quando fórmula real chegar |
| Persistência | `upsertScores` existente — sem novo endpoint |
| Jogadores ausentes | `attended=false, points=0` automático |

## Fluxo

```
Antes da etapa:
  Admin abre /check-in → Seção 1 (check-in)
  Jogadores chegam → admin clica "Check-in" em cada card
  → card vira crimson/presente

Durante/após etapa:
  Seção 2 (colocações) aparece automaticamente ao 1º check-in
  Cada jogador presente tem campo numérico "Posição"
  Admin preenche 1, 2, 3... ao final da noite
  Botão "Salvar Pontuação" habilita quando:
    - Todas as posições preenchidas (sem campo vazio)
    - Sem posições duplicadas
    - Posições formam sequência 1..N

Ao salvar:
  calculatePoints(position, total) → pontos por jogador
  upsertScores([presentes com pontos] + [ausentes com 0])
  Leaderboard/tabelas atualizam automaticamente
```

## Seção 1 — Check-in (existente, sem mudança funcional)

Grid 2col/3col igual ao atual. Mantém comportamento atual. Check-in continua disponível mesmo após seção 2 aparecer (chegadas tardias).

## Seção 2 — Colocações (nova)

- Aparece quando `checkedIn.size >= 1`
- Título: "Colocações — Semana N"
- Lista dos jogadores com check-in, cada um com:
  - Avatar de iniciais (crimson — já presente)
  - Nome
  - `<input type="number" min="1" max={checkedIn.size}>` para a posição
- Validação em tempo real: highlight vermelho em posições duplicadas
- Botão "Salvar Pontuação": desabilitado até validação passar
- Estado de loading durante `upsertScores`
- Mensagem de sucesso após salvar

## Fórmula placeholder

```ts
function calculatePoints(position: number, totalPlayers: number): number {
  return Math.max(totalPlayers - position + 1, 1);
}
```

Isolada em `lib/utils/points.ts` para fácil substituição.

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `lib/utils/points.ts` — `calculatePoints` |
| Modificar | `components/check-in-form.tsx` — adicionar estado + UI de colocações |
