# Design: Correção de Estatísticas e Hall da Fama Dinâmico

**Data:** 2026-02-28
**Status:** Aprovado

---

## Contexto

Dois problemas estruturais identificados após uso do app em produção:

1. **Hall da Fama** — landing page usa array hardcoded que diverge do banco; temporadas 33–35 ausentes da tabela `hall_of_fame`.
2. **Estatísticas** — campo `wins` monolítico (confunde vitórias de etapa com vitórias de temporada); `attendance_pct` usa denominador errado.

---

## Problema 1: Hall da Fama

### Causa
`app/page.tsx` declara um array estático `HALL_OF_FAME` com 6 entradas (temporadas XXX–XXXV). Esse array nunca foi sincronizado com o banco. A tabela `hall_of_fame` no Supabase foi populada via migration até a temporada 32, e as temporadas 33–35 nunca foram inseridas.

Inconsistências confirmadas entre DB e hardcoded:
- Temporada 30: DB → Rafael/Edson | Hardcoded → Marcel
- Temporada 31: DB → Rafael/Pedro | Hardcoded → Rodrigo Gurgel
- Temporada 32: DB → Rodrigo/Léo  | Hardcoded → Rafael Giovanella

### Solução
- Remover o array `HALL_OF_FAME` hardcoded de `app/page.tsx`
- Adicionar chamada a `getHallOfFame(supabase)` na `LandingPage` (já é async/server component)
- Exibir as **6 temporadas mais recentes** (ORDER BY season_number DESC LIMIT 6)
- Adaptar a coluna "Destaque" para usar `runner_up` do banco (em vez do campo `note` que não existe no schema)

### SQL a executar no Supabase (responsabilidade do usuário)

```sql
-- 1. Corrigir temporadas 30–32 (substituir pelos dados reais)
UPDATE hall_of_fame SET champion = 'NOME_REAL', runner_up = 'NOME_REAL' WHERE season_number = 30;
UPDATE hall_of_fame SET champion = 'NOME_REAL', runner_up = 'NOME_REAL' WHERE season_number = 31;
UPDATE hall_of_fame SET champion = 'NOME_REAL', runner_up = 'NOME_REAL' WHERE season_number = 32;

-- 2. Inserir temporadas 33–35
INSERT INTO hall_of_fame (season_number, champion, runner_up) VALUES
  (33, 'Carlos Henrique', 'VICE_REAL'),
  (34, 'Léo Negreiros',   'VICE_REAL'),
  (35, 'Léo Negreiros',   'VICE_REAL');
```

---

## Problema 2: Estatísticas

### 2a. Split de vitórias

**Atual:** campo único `wins` — contabiliza vitórias de temporada.

**Novo:**
- `season_wins` — jogador com maior pontuação total em uma temporada (rename do atual `wins`)
- `week_wins` — jogador com maior pontuação em uma única etapa

**Cálculo de `week_wins`:**
```
Para cada (season_id, week_number) com scores no banco:
  max_pts = max(points) entre jogadores com points > 0
  todos com points == max_pts recebem +1 week_win
```

**Tipos afetados:** `AllTimePlayerStat` em `lib/supabase/types.ts`
- Renomear `wins: number` → `season_wins: number`
- Adicionar `week_wins: number`

### 2b. Correção de `attendance_pct`

**Problema atual:**
```ts
attendance_pct = attended_count / total_score_records * 100
// total_score_records = registros existentes no DB para o jogador
```
Isso ignora que jogadores diferentes entraram em épocas diferentes.

**Novo cálculo:**
```
1. Construir lista ordenada de todos os slots de semana jogados:
   allWeekSlots = [(season_id, week_number), ...] ordenados por
   (season.created_at ASC, week_number ASC)

2. Para cada jogador:
   first_slot = índice do primeiro slot onde o jogador tem registro
   total_since_first = allWeekSlots.length - first_slot

3. attendance_pct = round(attended_count / total_since_first * 100)
```

**Exemplo:**
- Foram jogados 85 slots no total
- Jogador apareceu pela primeira vez no slot 38
- Total possível para ele: 85 - 38 = 47 slots
- Ele compareceu em 38 → `round(38/47 * 100) = 81%`

### 2c. Impacto na UI (`stats-content.tsx`)

- Atualizar `SortKey` type: `wins` → `season_wins`, adicionar `week_wins`
- Atualizar `SORT_LABELS`: `"Vitórias"` → `"Vit. Temp."` + novo `"Vit. Etapa"`
- Adicionar coluna `week_wins` na tabela (entre `season_wins` e `podiums`)
- Header da tabela: nova `<th>` para vitórias de etapa

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `lib/supabase/types.ts` | Renomear `wins` → `season_wins`, adicionar `week_wins` |
| `lib/queries/stats.ts` | Implementar `week_wins` e corrigir `attendance_pct` |
| `app/estatisticas/stats-content.tsx` | Atualizar colunas e sort keys |
| `app/page.tsx` | Remover array hardcoded, buscar HoF do banco |

**Arquivos NÃO modificados:** `app/hall-da-fama/page.tsx` (já lê do banco corretamente), `lib/queries/hall-of-fame.ts` (correto), schema SQL.

---

## Fora do escopo

- Interface de admin para gerenciar entradas do Hall da Fama
- Tratamento de empate diferenciado para season_wins
- Histórico de partidas individuais
