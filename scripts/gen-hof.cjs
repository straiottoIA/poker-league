/**
 * gen-hof.cjs
 * Lê o ttpf_seed.sql, calcula campeão e vice de cada temporada
 * a partir dos scores, e gera INSERT ... ON CONFLICT SQL para hall_of_fame.
 *
 * Uso: node scripts/gen-hof.cjs > scripts/hof_upsert.sql
 */

const fs = require("fs");
const path = require("path");

const SEED = path.resolve(__dirname, "../../Downloads/ttpf_seed.sql");
const raw = fs.readFileSync(SEED, "utf-8");

// ── helpers ────────────────────────────────────────────────────────────────

function parseInsert(sql, table) {
  // Extract everything inside INSERT INTO <table> ... VALUES (...);
  const re = new RegExp(
    `INSERT INTO ${table}[^;]+?VALUES([\\s\\S]+?);(?=\\s*(?:--|INSERT|$))`,
    "gi"
  );
  const rows = [];
  let m;
  while ((m = re.exec(sql)) !== null) {
    const block = m[1];
    // Each row: ( val, val, ... )
    const rowRe = /\(([^)]+)\)/g;
    let r;
    while ((r = rowRe.exec(block)) !== null) {
      const cols = r[1].split(",").map((c) => {
        c = c.trim();
        if (c === "NOW()") return null;
        if (c.startsWith("'") && c.endsWith("'")) return c.slice(1, -1);
        if (c === "true") return true;
        if (c === "false") return false;
        return isNaN(c) ? c : Number(c);
      });
      rows.push(cols);
    }
  }
  return rows;
}

function toRoman(n) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let out = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
  }
  return out;
}

// ── parse tables ───────────────────────────────────────────────────────────

// players: [id, name, created_at]
const players = parseInsert(raw, "players");
const playerName = new Map(players.map((r) => [r[0], r[1]]));

// seasons: [id, name, num_weeks, is_active, created_at]
const seasons = parseInsert(raw, "seasons");
const seasonNumber = new Map(); // uuid -> number
seasons.forEach((r, idx) => {
  seasonNumber.set(r[0], idx + 1); // seed is in order I, II, ...
});

// scores: [id, season_id, player_id, week_number, points, attended, created_at]
const scores = parseInsert(raw, "scores");

// ── compute totals ─────────────────────────────────────────────────────────

// Map: season_uuid -> Map<player_uuid, total_points>
const totals = new Map();
for (const [, season_id, player_id, , points] of scores) {
  if (!totals.has(season_id)) totals.set(season_id, new Map());
  const m = totals.get(season_id);
  m.set(player_id, (m.get(player_id) ?? 0) + points);
}

// ── build hall of fame ─────────────────────────────────────────────────────

const hof = []; // { season_number, champion, runner_up }

for (const [seasonUuid, playerMap] of totals) {
  const num = seasonNumber.get(seasonUuid);
  if (!num) continue;

  const sorted = [...playerMap.entries()]
    .sort((a, b) => b[1] - a[1]);

  const champion = playerName.get(sorted[0]?.[0]) ?? "?";
  const runner_up = playerName.get(sorted[1]?.[0]) ?? "?";

  hof.push({ season_number: num, champion, runner_up });
}

hof.sort((a, b) => a.season_number - b.season_number);

// ── output SQL ─────────────────────────────────────────────────────────────

const lines = hof.map(
  ({ season_number, champion, runner_up }) =>
    `  (${season_number}, '${champion.replace(/'/g, "''")}', '${runner_up.replace(/'/g, "''")}')`
);

console.log("-- Hall of Fame: campeões e vices calculados dos scores");
console.log("-- Execute no Supabase SQL Editor");
console.log();
console.log("INSERT INTO hall_of_fame (season_number, champion, runner_up) VALUES");
console.log(lines.join(",\n"));
console.log("ON CONFLICT (season_number) DO UPDATE SET");
console.log("  champion  = EXCLUDED.champion,");
console.log("  runner_up = EXCLUDED.runner_up;");
console.log();
console.log(`-- Total: ${hof.length} temporadas`);

// ── preview ────────────────────────────────────────────────────────────────
process.stderr.write("\nPreview (últimas 10 temporadas):\n");
hof.slice(-10).forEach(({ season_number, champion, runner_up }) => {
  process.stderr.write(
    `  ${String(toRoman(season_number)).padEnd(8)} ${champion.padEnd(20)} ${runner_up}\n`
  );
});
