import { createClient } from "@/lib/supabase/server";
import { getHallOfFame } from "@/lib/queries/hall-of-fame";
import type { HallEntry } from "@/lib/queries/hall-of-fame";
import { toRoman } from "@/lib/utils/roman";

interface ChampionStat {
  rank: number;
  name: string;
  achievements: number;
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function AwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 15v4" />
      <path d="m10 17 2-2 2 2" />
    </svg>
  );
}

type PodiumConfig = {
  Icon: ({ className }: { className?: string }) => React.ReactElement;
  iconClass: string;
  borderClass: string;
  gradientClass: string;
  badgeClass: string;
};

const PODIUM_CONFIGS: Record<1 | 2 | 3, PodiumConfig> = {
  1: {
    Icon: TrophyIcon,
    iconClass: "text-yellow-400",
    borderClass: "border-yellow-500",
    gradientClass: "from-yellow-900/30 to-transparent",
    badgeClass: "bg-yellow-500 text-black",
  },
  2: {
    Icon: AwardIcon,
    iconClass: "text-zinc-300",
    borderClass: "border-zinc-400",
    gradientClass: "from-zinc-700/40 to-transparent",
    badgeClass: "bg-zinc-400 text-black",
  },
  3: {
    Icon: MedalIcon,
    iconClass: "text-amber-500",
    borderClass: "border-amber-600",
    gradientClass: "from-amber-900/30 to-transparent",
    badgeClass: "bg-amber-600 text-white",
  },
};

export default async function HallDaFamaPage() {
  const supabase = await createClient();
  const entries: HallEntry[] = await getHallOfFame(supabase);

  const titleMap = new Map<string, number>();
  for (const e of entries) {
    titleMap.set(e.champion, (titleMap.get(e.champion) ?? 0) + 1);
  }
  const champions: ChampionStat[] = Array.from(titleMap.entries())
    .map(([name, achievements]) => ({ name, achievements, rank: 0 }))
    .sort((a, b) => b.achievements - a.achievements || a.name.localeCompare(b.name))
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const top3 = champions.slice(0, 3);
  const rest = champions.slice(3);

  const maxSeason = entries.reduce((max, e) => Math.max(max, e.season_number), 0);
  const allPlayers = new Set([
    ...entries.map((e) => e.champion),
    ...entries.map((e) => e.runner_up),
  ]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="bg-panel rounded-xl px-6 py-14 text-center">
        <SparklesIcon className="w-8 h-8 text-crimson mx-auto mb-4" />
        <p className="font-body text-[10px] font-bold uppercase tracking-[5px] text-zinc-500 mb-3">
          TTPF · Est. 2009
        </p>
        <h1 className="font-heading text-5xl font-bold text-white mb-3">
          Hall da Fama
        </h1>
        <p className="font-body text-sm text-zinc-400">
          {entries.length} temporadas · os grandes campeões da história
        </p>
      </div>

      {/* Pódio Top 3 */}
      {top3.length >= 1 && (
        <section>
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-ink">Pódio All-Time</h2>
          </div>

          {/* Desktop: 2nd | 1st | 3rd · Mobile: 1st, 2nd, 3rd */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-center gap-4 sm:gap-6">
            {top3.map((champion) => {
              const rank = champion.rank as 1 | 2 | 3;
              const config = PODIUM_CONFIGS[rank];
              const orderClass =
                rank === 1 ? "sm:order-2" : rank === 2 ? "sm:order-1" : "sm:order-3";
              const sizeClass =
                rank === 1 ? "sm:w-80 py-10" : "sm:w-64 py-6";

              return (
                <div
                  key={champion.name}
                  className={`relative flex flex-col items-center gap-4 bg-panel border-2 ${config.borderClass} rounded-xl px-6 ${sizeClass} ${orderClass} transition-transform duration-200 hover:scale-105 mx-auto sm:mx-0 w-full`}
                >
                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-b ${config.gradientClass} pointer-events-none`}
                  />

                  {/* Rank badge */}
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${config.badgeClass} flex items-center justify-center font-body font-bold text-sm border-2 border-panel z-10`}
                  >
                    {rank}º
                  </div>

                  {/* Icon */}
                  <config.Icon className={`w-10 h-10 ${config.iconClass} relative z-10 mt-2`} />

                  {/* Avatar */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-zinc-800 border-4 border-crimson flex items-center justify-center shrink-0">
                    <span className="font-heading text-xl font-bold text-white">
                      {getInitials(champion.name)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="relative z-10 text-center pb-2">
                    <p className="font-heading font-bold text-white text-lg leading-tight">
                      {champion.name}
                    </p>
                    <p className="font-heading font-bold text-crimson text-4xl mt-2">
                      {champion.achievements}
                    </p>
                    <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-zinc-500 mt-0.5">
                      {champion.achievements === 1 ? "conquista" : "conquistas"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lista 4º em diante */}
      {rest.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
            <h2 className="font-heading text-xl font-bold text-ink">Outros Campeões</h2>
          </div>
          <div className="space-y-2">
            {rest.map((champion) => (
              <div
                key={champion.name}
                className="flex items-center gap-4 bg-surface border border-border-subtle rounded-lg px-4 py-3 hover:border-crimson/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-panel flex items-center justify-center shrink-0">
                  <span className="font-body text-xs font-bold text-zinc-500">
                    {champion.rank}º
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-panel border border-border-subtle flex items-center justify-center shrink-0">
                  <span className="font-body text-xs font-bold text-secondary">
                    {getInitials(champion.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-ink truncate">
                    {champion.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-heading text-lg font-bold text-crimson">
                    {champion.achievements}
                  </span>
                  <span className="font-body text-xs text-muted ml-1">
                    {champion.achievements === 1 ? "título" : "títulos"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Histórico por temporada */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-border-subtle pb-3">
          <h2 className="font-heading text-xl font-bold text-ink">Por Temporada</h2>
        </div>
        <div className="overflow-hidden border border-border-strong bg-surface">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-strong bg-canvas">
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  Temp.
                </th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  Campeão
                </th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  Vice
                </th>
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

      {/* Footer stats */}
      <div className="bg-panel rounded-xl px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-heading text-3xl font-bold text-crimson">{maxSeason}+</p>
            <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-zinc-500 mt-1">
              Temporadas
            </p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-crimson">200+</p>
            <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-zinc-500 mt-1">
              Torneios
            </p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-crimson">{allPlayers.size}</p>
            <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-zinc-500 mt-1">
              Membros HoF
            </p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-crimson">2009</p>
            <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-zinc-500 mt-1">
              Fundação
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
