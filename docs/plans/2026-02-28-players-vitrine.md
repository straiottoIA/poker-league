# Players Vitrine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformar a página `/players` de uma lista CRUD básica numa vitrine em grid de cards com avatar (iniciais), nome, pontos totais e vitórias de temporada.

**Architecture:** `page.tsx` busca `players` + `allTimeStats` no servidor e faz join por `player_id`. Um novo componente client `PlayerGrid` recebe `PlayerWithStats[]` e cuida de exibição + CRUD (add/remove) para admin logado. O componente antigo `player-list.tsx` não é mais usado pelo `page.tsx` mas será mantido no disco para não quebrar imports.

**Tech Stack:** Next.js 16 (Server Component), React 19, TypeScript, Tailwind CSS 4, Supabase, `lib/queries/stats.ts` (getEstatisticasData já existente)

---

### Task 1: Criar PlayerGrid component

**Files:**
- Create: `components/player-grid.tsx`

**Step 1: Criar o arquivo com o seguinte conteúdo exato**

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPlayer, deletePlayer } from "@/lib/queries/players";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import { ConfirmDialog } from "@/components/confirm-dialog";

export interface PlayerWithStats {
  id: string;
  name: string;
  total_points: number | null;
  season_wins: number | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerGrid({ initialPlayers }: { initialPlayers: PlayerWithStats[] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const player = await createPlayer(supabase, name.trim());
      setPlayers((prev) =>
        [...prev, { ...player, total_points: null, season_wins: null }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar jogador.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setError("");
    try {
      const supabase = createClient();
      await deletePlayer(supabase, id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar jogador.");
    }
  };

  const pendingPlayerName = players.find((p) => p.id === pendingDeleteId)?.name ?? "";

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover jogador"
        message={`Tem certeza que deseja remover "${pendingPlayerName}"? Isso vai removê-lo de todas as temporadas.`}
        confirmLabel="Remover"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDeleteId(null)}
      />

      {isLoggedIn && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do jogador"
            className="flex-1 border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson disabled:opacity-50"
          >
            {loading ? "..." : "Adicionar"}
          </button>
        </div>
      )}

      {error && (
        <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
          {error}
        </p>
      )}

      {players.length === 0 ? (
        <div className="border border-border-strong bg-surface px-8 py-12 text-center">
          <p className="font-body text-sm text-muted">Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="relative flex flex-col gap-4 border border-border-subtle bg-surface p-5 transition-colors hover:border-crimson/30"
            >
              {isLoggedIn && (
                <button
                  onClick={() => setPendingDeleteId(player.id)}
                  className="absolute right-3 top-3 font-body text-[10px] font-bold text-muted transition-colors hover:text-crimson"
                  aria-label={`Remover ${player.name}`}
                >
                  ×
                </button>
              )}

              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel">
                  <span className="font-heading text-sm font-bold text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <p className="font-heading text-sm font-bold leading-tight text-ink">
                  {player.name}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
                <div>
                  <p className="font-heading text-xl font-bold text-crimson">
                    {player.total_points ?? "—"}
                  </p>
                  <p className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-[2px] text-muted">
                    Pontos
                  </p>
                </div>
                <div>
                  <p className="font-heading text-xl font-bold text-crimson">
                    {player.season_wins ?? "—"}
                  </p>
                  <p className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-[2px] text-muted">
                    Vit. Temp.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verificar build**

```bash
cd "C:/Users/User/poker-league"
npm run build
```

Expected: ✓ Compiled successfully (o novo componente ainda não é usado, mas deve compilar sem erros).

**Step 3: Commit**

```bash
git add components/player-grid.tsx
git commit -m "feat: add PlayerGrid component with stats cards"
```

---

### Task 2: Atualizar page.tsx para usar PlayerGrid

**Files:**
- Modify: `app/players/page.tsx`

**Step 1: Substituir o conteúdo do arquivo**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { getSeasons } from "@/lib/queries/seasons";
import { getEstatisticasData } from "@/lib/queries/stats";
import { PlayerGrid, type PlayerWithStats } from "@/components/player-grid";

export default async function PlayersPage() {
  const supabase = await createClient();

  const [players, seasons] = await Promise.all([
    getPlayers(supabase),
    getSeasons(supabase),
  ]);

  const { allTimeStats } = await getEstatisticasData(supabase, seasons);

  const statsMap = new Map(allTimeStats.map((s) => [s.player_id, s]));

  const playersWithStats: PlayerWithStats[] = players.map((p) => {
    const stats = statsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      total_points: stats?.total_points ?? null,
      season_wins: stats?.season_wins ?? null,
    };
  });

  return (
    <div className="space-y-10">
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Jogadores</h1>
        <p className="mt-2 font-body text-sm text-secondary">
          {players.length} jogador{players.length !== 1 ? "es" : ""} cadastrado{players.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <PlayerGrid initialPlayers={playersWithStats} />
    </div>
  );
}
```

**Step 2: Verificar build**

```bash
cd "C:/Users/User/poker-league"
npm run build
```

Expected: ✓ Compiled successfully — `/players` deve aparecer na lista de rotas como `ƒ` (dynamic).

**Step 3: Commit e push**

```bash
git add app/players/page.tsx
git commit -m "feat: replace player list with stats grid vitrine"
git push
```
