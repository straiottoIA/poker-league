import { createClient } from "@/lib/supabase/server";
import { getHallOfFame } from "@/lib/queries/hall-of-fame";
import type { HallEntry } from "@/lib/queries/hall-of-fame";

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

interface ChampionCount {
  name: string;
  titles: number;
}

export default async function HallDaFamaPage() {
  const supabase = await createClient();
  const entries: HallEntry[] = await getHallOfFame(supabase);

  // Contagem de títulos por jogador
  const titleMap = new Map<string, number>();
  for (const e of entries) {
    titleMap.set(e.champion, (titleMap.get(e.champion) ?? 0) + 1);
  }
  const champions: ChampionCount[] = Array.from(titleMap.entries())
    .map(([name, titles]) => ({ name, titles }))
    .sort((a, b) => b.titles - a.titles || a.name.localeCompare(b.name));

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">
          TTPF — Est. 2010
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">
          Hall da Fama
        </h1>
        <p className="mt-3 font-body text-sm text-secondary">
          {entries.length} temporadas · os campeões e vices de cada edição
        </p>
      </div>

      {/* Ranking de títulos */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♠</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Mais Títulos</h2>
        </div>
        <div className="overflow-hidden border border-border-strong bg-surface">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-strong bg-canvas">
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">#</th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
                <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Títulos</th>
              </tr>
            </thead>
            <tbody>
              {champions.map((c, i) => (
                <tr
                  key={c.name}
                  className={`border-b border-border-subtle transition-colors hover:bg-canvas/60 ${
                    i === 0 ? "bg-tint-crimson-row" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    {i < 3 ? (
                      <span className="bg-crimson px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
                        {i + 1}°
                      </span>
                    ) : (
                      <span className="font-body text-sm text-muted">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3.5 text-right font-heading text-lg font-bold text-crimson">
                    {c.titles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabela de temporadas */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♣</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Por Temporada</h2>
        </div>
        <div className="overflow-hidden border border-border-strong bg-surface">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-strong bg-canvas">
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Temp.</th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Campeão</th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Vice</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border-subtle transition-colors hover:bg-canvas/60"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-heading text-base font-bold text-crimson">
                      {toRoman(e.season_number)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm font-semibold text-ink">
                    {e.champion}
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm text-secondary">
                    {e.runner_up}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
