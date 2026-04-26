'use strict';

// Script one-time: cria as 2 contas de acesso do TTPF no Supabase.
// Uso: node scripts/seed-users.cjs
// Requer SUPABASE_SERVICE_ROLE_KEY em .env.local

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const passGabriel = process.env.SEED_PASSWORD_GABRIEL;
const passRafael = process.env.SEED_PASSWORD_RAFAEL;

if (!url || !serviceKey || !passGabriel || !passRafael) {
  console.error(
    'Erro: verifique .env.local — precisam existir:\n' +
    '  SUPABASE_SERVICE_ROLE_KEY\n' +
    '  SEED_PASSWORD_GABRIEL\n' +
    '  SEED_PASSWORD_RAFAEL'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { username: 'gabriel', password: passGabriel },
  { username: 'rafael',  password: passRafael },
];

async function main() {
  for (const u of users) {
    const email = `${u.username}@ttpf.local`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already been registered')) {
        console.log(`• ${u.username} — já existe, pulando.`);
      } else {
        console.error(`✗ Erro ao criar ${u.username}:`, error.message);
      }
    } else {
      console.log(`✓ ${u.username} criado (id: ${data.user.id})`);
    }
  }
}

main();
