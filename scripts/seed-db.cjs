'use strict';

// Executa o ttpf_seed.sql diretamente no banco de dados via pg.
// Lê DATABASE_URL do .env.local automaticamente.

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Carrega .env.local sem precisar do pacote dotenv
function loadEnvLocal() {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const raw of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const line = raw.replace(/\r$/, '');
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim();
    }
  }
}
loadEnvLocal();

const SQL_FILE = path.join(
  'C:/Users/User/Downloads',
  'ttpf_seed.sql'
);

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌  DATABASE_URL não definida.');
  console.error('');
  console.error('   Rode assim:');
  console.error('   DATABASE_URL="postgresql://..." node scripts/seed-db.cjs');
  console.error('');
  console.error('   Pegue a connection string em:');
  console.error('   Supabase → Settings → Database → Connection string → URI (Direct)');
  process.exit(1);
}

if (!fs.existsSync(SQL_FILE)) {
  console.error(`❌  Arquivo não encontrado: ${SQL_FILE}`);
  process.exit(1);
}

async function main() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const sizeKb = (fs.statSync(SQL_FILE).size / 1024).toFixed(0);

  console.log(`📄  Arquivo: ${SQL_FILE} (${sizeKb} KB)`);
  console.log('🔌  Conectando ao banco...');

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅  Conectado.');

    console.log('🗑️   Limpando tabelas (TRUNCATE CASCADE)...');
    await client.query('BEGIN');
    await client.query('TRUNCATE scores, season_players, seasons, players RESTART IDENTITY CASCADE');
    console.log('✅  Tabelas limpas.');

    console.log('⏳  Inserindo seed (pode levar alguns segundos)...');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅  Seed executado com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('');
    console.error('❌  Erro ao executar seed:');
    console.error('   ', err.message);
    console.error('');
    console.error('   Dica: verifique se as tabelas já existem no banco.');
    console.error('         Se o banco estiver vazio, crie o schema primeiro.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
