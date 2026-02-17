"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPlayer, deletePlayer } from "@/lib/queries/players";
import { useRouter } from "next/navigation";
import { Player } from "@/lib/supabase/types";

export function PlayerList({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const player = await createPlayer(supabase, name.trim());
      setPlayers((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this player? This will remove them from all seasons.")) return;
    const supabase = createClient();
    await deletePlayer(supabase, id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Player name"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !name.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {players.length === 0 ? (
        <p className="text-gray-500 text-sm">No players yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-900">
                {player.name}
              </span>
              <button
                onClick={() => handleDelete(player.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
