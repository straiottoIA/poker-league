const XLSX = require('./node_modules/xlsx/xlsx.js');
const { randomUUID } = require('crypto');
const { writeFileSync } = require('fs');

const FILE = 'C:/Users/User/Downloads/Ranking TTPF - dados normalizados.xlsx';
const OUTPUT = 'C:/Users/User/Downloads/ttpf_seed.sql';

const NAME_FIXES = {
  'Leo':          'Léo',
  'Leo Nogueira': 'Léo Nogueira',
  'Marcao':       'Marcão',
  'Petronio':     'Petrônio',
  'Piaui':        'Piauí',
  'Darlan':       'Darllan',
  'Davi':         'David',
  'John John':    'Jonh Jonh',
};

function fixName(raw) {
  const trimmed = raw?.toString().trim();
  return NAME_FIXES[trimmed] ?? trimmed;
}

function toRoman(n) {
  const val = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < val.length; i++) {
    while (n >= val[i]) { result += syms[i]; n -= val[i]; }
  }
  return result;
}

const wb = XLSX.readFile(FILE);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['dados'], { defval: null });

// Corrigir nomes
for (const row of rows) {
  if (row['Jogador']) row['Jogador'] = fixName(row['Jogador']);
}

// Players
const playerMap = new Map();
for (const row of rows) {
  const name = row['Jogador'];
  if (name && !playerMap.has(name)) playerMap.set(name, randomUUID());
}

// Seasons
const bySeasonRows = new Map();
for (const row of rows) {
  const snum = parseInt(row['Temporada']);
  if (isNaN(snum)) continue;
  if (!bySeasonRows.has(snum)) bySeasonRows.set(snum, []);
  bySeasonRows.get(snum).push(row);
}
const seasonNums = [...bySeasonRows.keys()].sort((a,b) => a-b);

const seasonMap = new Map();
for (const snum of seasonNums) {
  const srows = bySeasonRows.get(snum);
  let maxWeek = 0;
  for (const row of srows) {
    for (let w = 1; w <= 10; w++) {
      const val = row[String(w)];
      if (val !== null && val !== undefined && Number(val) > 0 && w > maxWeek) maxWeek = w;
    }
  }
  seasonMap.set(snum, {
    id: randomUUID(),
    name: toRoman(snum),
    num_weeks: maxWeek > 0 ? maxWeek : 1,
    is_active: false,
  });
}
seasonMap.get(Math.max(...seasonNums)).is_active = true;

const lines = [];
lines.push('-- TTPF Seed Script');
lines.push('-- Fonte: Ranking TTPF - dados normalizados.xlsx');
lines.push('-- Correções: Leo→Léo, Marcao→Marcão, Petronio→Petrônio, Piaui→Piauí,');
lines.push('--   Darlan→Darllan, Davi→David, John John→Jonh Jonh');
lines.push('-- season_players e scores deduplicados por (season_id, player_id[, week_number])');
lines.push('-- Execute no SQL Editor do Supabase');
lines.push('');

// PLAYERS
lines.push('-- ============================================================');
lines.push('-- PLAYERS');
lines.push('-- ============================================================');
const playerRows = [];
for (const [name, pid] of playerMap) {
  const safe = name.replace(/'/g, "''");
  playerRows.push(`  ('${pid}', '${safe}', NOW())`);
}
lines.push('INSERT INTO players (id, name, created_at) VALUES');
lines.push(playerRows.join(',\n') + ';');
lines.push('');

// SEASONS
lines.push('-- ============================================================');
lines.push('-- SEASONS');
lines.push('-- ============================================================');
const seasonRows = [];
for (const snum of seasonNums) {
  const s = seasonMap.get(snum);
  seasonRows.push(`  ('${s.id}', '${s.name}', ${s.num_weeks}, ${s.is_active}, NOW())`);
}
lines.push('INSERT INTO seasons (id, name, num_weeks, is_active, created_at) VALUES');
lines.push(seasonRows.join(',\n') + ';');
lines.push('');

// SEASON_PLAYERS — deduplicado por (season_id, player_id)
lines.push('-- ============================================================');
lines.push('-- SEASON_PLAYERS');
lines.push('-- ============================================================');
const spSeen = new Set();
const spRows = [];
let spDups = 0;
for (const row of rows) {
  const snum = parseInt(row['Temporada']);
  const name = row['Jogador'];
  if (isNaN(snum) || !name || !playerMap.has(name) || !seasonMap.has(snum)) continue;
  const sid = seasonMap.get(snum).id;
  const pid = playerMap.get(name);
  const key = `${sid}|${pid}`;
  if (spSeen.has(key)) { spDups++; continue; }
  spSeen.add(key);
  spRows.push(`  ('${randomUUID()}', '${sid}', '${pid}')`);
}
lines.push('INSERT INTO season_players (id, season_id, player_id) VALUES');
lines.push(spRows.join(',\n') + ';');
lines.push('');

// Pré-computar: quais temporadas têm dados semanais?
// Necessário porque jogadores ausentes na semana 1 têm row['1'] = null (defval),
// o que não significa que a temporada não tem colunas semanais — apenas que o jogador faltou.
const hasWeekDataBySeason = new Map(); // snum → boolean
for (const [snum, srows] of bySeasonRows) {
  const hasWeek = srows.some(row =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some(w =>
      row[String(w)] !== null && row[String(w)] !== undefined
    )
  );
  hasWeekDataBySeason.set(snum, hasWeek);
}

// SCORES — deduplicado por (season_id, player_id, week_number)
// Em caso de conflito, soma os pontos (dois registros de nomes diferentes que viraram o mesmo jogador)
lines.push('-- ============================================================');
lines.push('-- SCORES');
lines.push('-- ============================================================');

// Primeiro passa: agrupar em Map para detectar e resolver conflitos
// chave: "sid|pid|week" -> { pts acumulados, attended }
const scoreMap = new Map();
let scoreDups = 0;

for (const row of rows) {
  const snum = parseInt(row['Temporada']);
  const name = row['Jogador'];
  if (isNaN(snum) || !name || !playerMap.has(name) || !seasonMap.has(snum)) continue;

  const sid = seasonMap.get(snum).id;
  const pid = playerMap.get(name);
  const nw = seasonMap.get(snum).num_weeks;
  const hasWeekData = hasWeekDataBySeason.get(snum) ?? false;

  if (!hasWeekData) {
    const pts = parseFloat(row['Pont_final'] ?? 0) || 0;
    const key = `${sid}|${pid}|1`;
    if (scoreMap.has(key)) {
      // Soma pontos do duplicado
      const existing = scoreMap.get(key);
      existing.pts += pts;
      existing.attended = existing.attended || pts > 0;
      scoreDups++;
    } else {
      scoreMap.set(key, { sid, pid, week: 1, pts, attended: pts > 0 });
    }
  } else {
    for (let w = 1; w <= nw; w++) {
      const raw = row[String(w)];
      const pts = (raw !== null && raw !== undefined) ? (parseFloat(raw) || 0) : 0;
      const key = `${sid}|${pid}|${w}`;
      if (scoreMap.has(key)) {
        const existing = scoreMap.get(key);
        existing.pts += pts;
        existing.attended = existing.attended || pts > 0;
        scoreDups++;
      } else {
        scoreMap.set(key, { sid, pid, week: w, pts, attended: pts > 0 });
      }
    }
  }
}

const scoreRows = [];
for (const { sid, pid, week, pts, attended } of scoreMap.values()) {
  const safePts = isNaN(pts) ? 0 : pts;
  scoreRows.push(`  ('${randomUUID()}', '${sid}', '${pid}', ${week}, ${safePts.toFixed(2)}, ${attended}, NOW())`);
}

const BATCH = 500;
for (let i = 0; i < scoreRows.length; i += BATCH) {
  const batch = scoreRows.slice(i, i + BATCH);
  lines.push('INSERT INTO scores (id, season_id, player_id, week_number, points, attended, created_at) VALUES');
  lines.push(batch.join(',\n') + ';');
  lines.push('');
}

writeFileSync(OUTPUT, lines.join('\n'), 'utf8');

console.log(`\n✅ Arquivo gerado: ${OUTPUT}`);
console.log(`   Players:        ${playerMap.size}`);
console.log(`   Seasons:        ${seasonMap.size}`);
console.log(`   Season-players: ${spRows.length} (${spDups} duplicatas removidas)`);
console.log(`   Score rows:     ${scoreMap.size} (${scoreDups} conflitos somados)`);
console.log(`   Score batches:  ${Math.ceil(scoreRows.length / BATCH)}`);
