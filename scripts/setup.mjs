#!/usr/bin/env node
/*
 * HydroFlow setup — installs the Expo app and the Express/SQLite server,
 * then reseeds the demo database.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverRoot = path.join(root, 'server');

const run = (label, cmd, args, cwd) => {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) {
    console.error(`\n✖ ${label} failed (exit ${res.status})`);
    process.exit(res.status ?? 1);
  }
  console.log(`✔ ${label} done`);
};

console.log('HydroFlow setup');
console.log('---------------');

run('Install Expo app dependencies', process.platform === 'win32' ? 'npm' : 'npm', ['install', '--legacy-peer-deps'], root);

const lfs = path.join(root, 'package-lock.json');
if (lfs) {
  const hasServer = spawnSync('cmd', ['/c', 'npm', 'install'], { cwd: serverRoot, stdio: 'inherit' });
  if (hasServer.status === 0) {
    console.log('✔ Server dependencies installed');
  }
}

run('Seed demo database (households, tanker, pools, delivery run)', process.platform === 'win32' ? 'npm' : 'npm', ['run', 'seed', '--prefix', 'server'], root);

console.log('\n════════════════════════════════════════════════');
console.log(' HydroFlow is ready.');
console.log('');
console.log('  npm run dev     → Expo + API together');
console.log('  npm start       → Expo dev client only');
console.log('  npm run server  → Express API only (http://localhost:4000)');
console.log('  npm run seed    → reset demo data');
console.log('════════════════════════════════════════════════');