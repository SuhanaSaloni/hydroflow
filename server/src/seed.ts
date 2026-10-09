import { resetAndSeed } from './db';

resetAndSeed();
console.log('[hydroflow] seed complete — restart the dev server to load fresh data.');
process.exit(0);