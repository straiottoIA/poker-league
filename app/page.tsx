import type { CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSeasons, getActiveSeason } from "@/lib/queries/seasons";
import { getPlayers } from "@/lib/queries/players";
import { getHallOfFame } from "@/lib/queries/hall-of-fame";
import type { HallEntry } from "@/lib/queries/hall-of-fame";
import { getLeaderboard, getLastWeekSummary } from "@/lib/queries/scores";
import { toRoman } from "@/lib/utils/roman";

// Full-bleed helper: breaks out of max-w-5xl container to viewport width
const bleedStyle: CSSProperties = {
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
};

export default async function LandingPage() {
  const supabase = await createClient();

  const [seasons, players, activeSeason, hallEntries] = await Promise.all([
    getSeasons(supabase),
    getPlayers(supabase),
    getActiveSeason(supabase),
    getHallOfFame(supabase),
  ]);

  const [leaderboard, lastWeek] = activeSeason
    ? await Promise.all([
        getLeaderboard(supabase, activeSeason.id),
        getLastWeekSummary(supabase, activeSeason.id, activeSeason.name),
      ])
    : [[], null];

  const recentHall: HallEntry[] = hallEntries.slice(0, 6);
  const leader = leaderboard[0] ?? null;
  const lastChampion = hallEntries[0] ?? null;

  const appLink = activeSeason ? `/seasons/${activeSeason.id}` : "/seasons";
  const totalSeasons = Math.max(seasons.length, 36);
  const totalPlayers = players.length;

  const newsCards = [
    lastWeek
      ? {
          date: `Sem. ${lastWeek.weekNumber} · ${lastWeek.seasonName}`,
          title: `Etapa ${lastWeek.weekNumber} encerrada`,
          body: `${lastWeek.topScorer.name} venceu com ${lastWeek.topScorer.points} pontos.`,
        }
      : {
          date: activeSeason ? activeSeason.name : "Liga",
          title: "Aguardando próxima etapa",
          body: "A temporada ainda não registrou resultados.",
        },
    lastChampion
      ? {
          date: `Temporada ${toRoman(lastChampion.season_number)}`,
          title: `${lastChampion.champion} é Campeão`,
          body: `Vice-campeão: ${lastChampion.runner_up}`,
        }
      : {
          date: "Hall da Fama",
          title: "Histórico em construção",
          body: "—",
        },
    leader && activeSeason
      ? {
          date: "Temporada Ativa",
          title: `${leader.player_name} lidera ${activeSeason.name}`,
          body: `${leader.total_points} pontos na temporada.`,
        }
      : {
          date: "Temporada",
          title: "Sem temporada ativa",
          body: "—",
        },
  ];

  return (
    <div className="-mt-10">
      {/* ── HERO ── */}
      <section style={bleedStyle} className="overflow-hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2">
          {/* Left: warm canvas */}
          <div className="flex flex-col justify-center bg-canvas px-8 py-20 sm:px-14">
            <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">
              Tip Total Poker Friends
            </p>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
              Onde cada mão conta uma{" "}
              <em className="not-italic text-crimson">história.</em>
            </h1>
            <div className="mt-5 h-px w-16 bg-crimson" />
            <p className="mt-5 font-body text-sm leading-relaxed text-secondary">
              O torneio de poker mais tradicional de Brasília. Desde 2009
              reunindo amigos, rivais e campeões ao redor do feltro verde.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={appLink}
                className="inline-block rounded-md bg-crimson px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)]"
              >
                Acessar o Sistema →
              </Link>
              <a
                href="https://ttpfpoker.blogspot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border-2 border-ink px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink hover:text-canvas"
              >
                Blog Histórico
              </a>
            </div>
          </div>

          {/* Right: dark panel */}
          <div className="relative hidden min-h-[460px] items-center justify-center overflow-hidden bg-panel md:flex">
            <span
              className="pointer-events-none absolute font-heading text-[180px] font-bold leading-none text-crimson/[0.07] select-none"
              aria-hidden="true"
            >
              TTPF
            </span>
            <div className="relative z-10 text-center">
              <span
                className="block font-heading text-[96px] leading-none text-crimson"
                style={{ textShadow: "0 0 60px rgba(229,57,53,0.25)" }}
                aria-hidden="true"
              >
                ♠
              </span>
              <p className="mt-5 font-body text-[11px] font-bold uppercase tracking-[4px] text-white/40">
                Est. 2009 — Brasília, DF
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={bleedStyle} className="overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 border-y-2 border-ink bg-canvas sm:grid-cols-4">
            {[
              { num: `${totalSeasons}+`, label: "Temporadas" },
              { num: "200+", label: "Torneios" },
              {
                num: `${totalPlayers > 0 ? totalPlayers : "15"}+`,
                label: "Membros",
              },
              { num: "2009", label: "Fundação" },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                className={`px-8 py-7 text-center ${
                  i < arr.length - 1 ? "border-r border-border-strong" : ""
                }`}
              >
                <p className="font-heading text-[28px] font-bold text-crimson sm:text-[32px]">
                  {stat.num}
                </p>
                <p className="mt-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section className="mx-auto mt-16 max-w-5xl space-y-8 px-4 sm:px-6">
        <div className="flex items-center gap-3 border-b-2 border-ink pb-4">
          <span className="font-body text-[10px] font-bold text-crimson" aria-hidden="true">
            ♣
          </span>
          <h2 className="font-heading text-2xl font-bold text-ink">Sobre o TTPF</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: "♠",
              title: "Tradição desde 2009",
              desc: "O TTPF nasceu entre amigos em Brasília e cresceu até se tornar um dos campeonatos amadores mais sólidos da cidade, com regras, temporadas e ranking próprios.",
            },
            {
              icon: "♦",
              title: "Temporadas e Etapas",
              desc: "Cada temporada é disputada em etapas semanais. Os pontos acumulados definem o campeão. Já são mais de 35 temporadas completas de história.",
            },
            {
              icon: "♥",
              title: "Comunidade Forte",
              desc: "Membros fixos, convidados especiais e uma rivalidade saudável que transforma cada noite de cartas em memória. O TTPF é sobre pessoas tanto quanto sobre poker.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-border-strong bg-surface p-7 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-crimson/30 hover:shadow-[var(--shadow-md)]"
            >
              <span className="block font-body text-xl text-crimson" aria-hidden="true">
                {card.icon}
              </span>
              <h3 className="mt-4 font-heading text-base font-bold text-ink">
                {card.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-secondary">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HALL DA FAMA ── */}
      <section className="mx-auto mt-16 max-w-5xl space-y-8 px-4 sm:px-6">
        <div className="flex items-center gap-3 border-b-2 border-ink pb-4">
          <span className="font-body text-[10px] font-bold text-crimson" aria-hidden="true">
            ♠
          </span>
          <h2 className="font-heading text-2xl font-bold text-ink">Hall da Fama</h2>
        </div>

        <div className="overflow-hidden border border-border-strong bg-surface">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-strong bg-canvas">
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  Temporada
                </th>
                <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                  Campeão
                </th>
                <th className="hidden px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted sm:table-cell">
                  Vice
                </th>
              </tr>
            </thead>
            <tbody>
              {recentHall.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-border-subtle transition-colors hover:bg-canvas/60 ${
                    i === 0 ? "bg-tint-crimson-row" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    {i === 0 ? (
                      <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold text-white">
                        {toRoman(entry.season_number)}
                      </span>
                    ) : (
                      <span className="font-heading text-sm font-bold text-crimson">
                        {toRoman(entry.season_number)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm font-medium text-ink">
                    {entry.champion}
                  </td>
                  <td className="hidden px-5 py-3.5 font-body text-xs text-muted sm:table-cell">
                    {entry.runner_up}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ÚLTIMAS NOTÍCIAS ── */}
      <section className="mx-auto mt-16 max-w-5xl space-y-8 px-4 sm:px-6">
        <div className="flex items-center justify-between border-b-2 border-ink pb-4">
          <div className="flex items-center gap-3">
            <span className="font-body text-[10px] font-bold text-crimson" aria-hidden="true">
              ♥
            </span>
            <h2 className="font-heading text-2xl font-bold text-ink">
              Últimas Notícias
            </h2>
          </div>
          <a
            href="https://ttpfpoker.blogspot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[11px] font-bold uppercase tracking-[2px] text-crimson transition-opacity hover:opacity-70"
          >
            Ver todas →
          </a>
        </div>

        <div className="grid gap-7 sm:grid-cols-3">
          {newsCards.map((item, i) => (
            <div key={i} className="border-t-2 border-crimson pt-5">
              <p className="font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                {item.date}
              </p>
              <h3 className="mt-3 font-heading text-base font-bold leading-snug text-ink">
                {item.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-secondary">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={bleedStyle} className="mt-16 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="bg-panel px-8 py-16 text-center sm:px-16">
            <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">
              Sistema Oficial
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
              Temporadas, rankings e check-in
              <br />
              na palma da mão.
            </h2>
            <p className="mx-auto mt-5 max-w-md font-body text-sm leading-relaxed text-white/40">
              O sistema TTPF registra presenças, pontuações e calcula o ranking
              de cada temporada automaticamente. Tudo em tempo real.
            </p>
            <Link
              href={appLink}
              className="mt-10 inline-block rounded-md bg-crimson px-12 py-4 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)]"
            >
              Acessar o Sistema →
            </Link>
            {activeSeason && (
              <p className="mt-5 font-body text-[11px] font-bold uppercase tracking-[3px] text-white/30">
                {activeSeason.name} em andamento
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={bleedStyle} className="overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="border-t-2 border-ink bg-canvas px-8 py-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="font-heading text-xl font-bold tracking-[3px] text-ink">
                TTP<em className="not-italic text-crimson">F</em>
              </p>
              <p className="font-body text-[11px] text-muted">
                Tip Total Poker Friends — Brasília, DF — Est. 2009
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="https://ttpfpoker.blogspot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-crimson"
                >
                  Blog →
                </a>
                <Link
                  href={appLink}
                  className="font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-crimson"
                >
                  Sistema →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
