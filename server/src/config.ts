import path from 'node:path';
import fs from 'node:fs';

export const PORT = Number(process.env.HYDROFLOW_PORT ?? 4000);

const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const DB_PATH = path.join(dataDir, 'hydroflow.db');

export const TANKER_CAPACITY_LITRES = 10000;
export const CLUSTER_RADIUS_KM = 2;