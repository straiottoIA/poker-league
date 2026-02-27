'use strict';

const { Client } = require('pg');
const { randomUUID } = require('crypto');
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

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("UPDATE seasons SET is_active = false WHERE is_active = true");
    const id = randomUUID();
    await client.query(
      'INSERT INTO seasons (id, name, num_weeks, is_active, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [id, 'LXXI', 10, true]
    );
    console.log('✅ Temporada LXXI criada:', id);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
