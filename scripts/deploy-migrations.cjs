#!/usr/bin/env node
/**
 * Supabase migrations deploy
 * Gereken: supabase login (bir kez) + SUPABASE_DB_PASSWORD (.env)
 * 
 * Kullanım: npm run db:deploy
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// .env yükle
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const password = process.env.SUPABASE_DB_PASSWORD;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.VITE_SUPABASE_PROJECT_ID || 'lzwwxuxwlssxutwiuxtf';

function run(cmd, env = {}) {
  const fullEnv = { ...process.env, ...env };
  try {
    execSync(cmd, { stdio: 'inherit', env: fullEnv, shell: true });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

console.log('Supabase migrations deploy basliyor...\n');

// 1. Supabase giris - once bir kez: npx supabase login
// 2. Link (SUPABASE_DB_PASSWORD .env'de olmali)
const linkEnv = { ...process.env };
if (password) linkEnv.SUPABASE_DB_PASSWORD = password;
if (accessToken) linkEnv.SUPABASE_ACCESS_TOKEN = accessToken;

console.log('Proje linkleniyor...');
try {
  execSync('npx supabase link --project-ref ' + projectRef, {
    stdio: 'inherit', env: linkEnv, shell: true
  });
} catch (e) {
  if (e.status !== 0) {
    console.log('\n--- HATA ---');
    console.log('1. Supabase giris: Once "npx supabase login" calistirin (tarayici acilir)');
    console.log('2. Veya .env\'e SUPABASE_ACCESS_TOKEN ekleyin:');
    console.log('   https://supabase.com/dashboard/account/tokens');
    console.log('3. SUPABASE_DB_PASSWORD .env\'de dogru olmali (Project Settings > Database)');
    process.exit(1);
  }
}

// 3. Push
console.log('\nMigrations uygulaniyor...');
run('npx supabase db push');

console.log('\nDeploy tamamlandi.');
