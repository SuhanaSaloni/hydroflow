import Database from 'better-sqlite3';
import { DB_PATH } from './config';
import { planLoad } from './services/routingService';
import { fairShareScore } from './services/priorityService';

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  occupants INTEGER NOT NULL,
  tank_capacity_litres INTEGER NOT NULL,
  current_level_litres INTEGER NOT NULL,
  address TEXT NOT NULL,
  floor TEXT NOT NULL,
  landmark TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  bookings_last_30_days INTEGER NOT NULL DEFAULT 0,
  hours_without_water REAL NOT NULL DEFAULT 0,
  critical_need INTEGER NOT NULL DEFAULT 0,
  critical_reason TEXT
);

CREATE TABLE IF NOT EXISTS borewells (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  tds_ppm INTEGER NOT NULL,
  ph REAL NOT NULL,
  verified INTEGER NOT NULL DEFAULT 1,
  yield_lph INTEGER NOT NULL,
  last_tested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  safety_rating REAL NOT NULL,
  trips_today INTEGER NOT NULL DEFAULT 0,
  photo_emoji TEXT NOT NULL DEFAULT '👨‍✈️'
);

CREATE TABLE IF NOT EXISTS tankers (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  capacity_litres INTEGER NOT NULL,
  loaded_litres INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  source_borewell_id TEXT NOT NULL REFERENCES borewells(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  litres INTEGER NOT NULL,
  otp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  run_id TEXT,
  stop_index INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  target_members INTEGER NOT NULL,
  target_litres INTEGER NOT NULL,
  cost_per_litre REAL NOT NULL,
  standard_cost_per_litre REAL NOT NULL,
  refill_eta TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pool_members (
  pool_id TEXT NOT NULL REFERENCES pools(id),
  household_id TEXT NOT NULL REFERENCES households(id),
  PRIMARY KEY (pool_id, household_id)
);

CREATE TABLE IF NOT EXISTS delivery_runs (
  id TEXT PRIMARY KEY,
  load_id TEXT NOT NULL,
  tanker_id TEXT NOT NULL REFERENCES tankers(id),
  capacity_litres INTEGER NOT NULL,
  total_litres INTEGER NOT NULL,
  cluster_lat REAL NOT NULL,
  cluster_lon REAL NOT NULL,
  radius_km REAL NOT NULL,
  total_distance_km REAL NOT NULL,
  status TEXT NOT NULL,
  source_borewell TEXT NOT NULL,
  stops_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function seed() {
  const h = db.prepare(
    `INSERT INTO households
       (id,name,occupants,tank_capacity_litres,current_level_litres,address,floor,landmark,lat,lon,
        bookings_last_30_days,hours_without_water,critical_need,critical_reason)
     VALUES (@id,@name,@occupants,@tank,@current,@address,@floor,@landmark,@lat,@lon,@bookings,@hours,@critical,@reason)`,
  );
  const households = [
    { id: 'H-1014', name: 'Mehta Family', occupants: 5, tank: 2000, current: 420, address: '12, Road No 5, Jubilee Hills', floor: '2nd Floor', landmark: 'Opp. Lotus Hospital', lat: 17.428, lon: 78.428, bookings: 2, hours: 38, critical: 1, reason: 'Elderly resident requires regular supply' },
    { id: 'H-3087', name: 'Iyer Residency', occupants: 4, tank: 1500, current: 210, address: '8, Road No 10, Banjara Hills', floor: '1st Floor', landmark: 'Near KFC, Main Rd', lat: 17.426, lon: 78.42, bookings: 1, hours: 52, critical: 0, reason: null },
    { id: 'H-2210', name: 'Khan Villa', occupants: 6, tank: 3000, current: 780, address: '43, Road No 3, Jubilee Hills', floor: 'Ground + 1', landmark: 'Blue Gate beside church', lat: 17.421, lon: 78.427, bookings: 3, hours: 21, critical: 0, reason: null },
    { id: 'H-4052', name: 'Reddy Apartments', occupants: 9, tank: 5000, current: 1650, address: '2-16, Film Nagar Main Rd', floor: 'Society Tank', landmark: 'Near Anjaneya Temple', lat: 17.419, lon: 78.421, bookings: 1, hours: 66, critical: 1, reason: 'Apartment complex, families with infants' },
    { id: 'H-5601', name: 'Sahni House', occupants: 3, tank: 1000, current: 330, address: '96, Road No 12, Banjara Hills', floor: 'Penthouse', landmark: 'Next to Petrol Bunk', lat: 17.431, lon: 78.423, bookings: 0, hours: 74, critical: 0, reason: null },
    { id: 'H-6712', name: 'Nair Street House', occupants: 4, tank: 1500, current: 540, address: '19, Road No 2, Banjara Hills', floor: '2nd Floor', landmark: 'Yellow compound, corner lane', lat: 17.425, lon: 78.431, bookings: 2, hours: 17, critical: 0, reason: null },
  ];
  for (const row of households) {
    h.run({
      id: row.id, name: row.name, occupants: row.occupants, tank: row.tank, current: row.current,
      address: row.address, floor: row.floor, landmark: row.landmark, lat: row.lat, lon: row.lon,
      bookings: row.bookings, hours: row.hours, critical: row.critical, reason: row.reason,
    });
  }

  db.prepare('INSERT INTO borewells VALUES (?,?,?,?,?,?,?,?)').run(
    'BW-07', 'Hafeezpet Borewell 7', 'Hafeezpet, Serilingampally', 212, 7.2, 1, 1800, '2026-09-12',
  );

  db.prepare('INSERT INTO drivers VALUES (?,?,?,?,?,?)').run(
    'D-5', 'Ramesh Goud', '+91 98490 11223', 4.8, 2, '👨‍✈️',
  );

  db.prepare('INSERT INTO tankers VALUES (?,?,?,?,?,?,?)').run(
    'T-107', 'TS 09 EX 4714', 10000, 10000, 'ON_ROUTE', 'D-5', 'BW-07',
  );

  const otps = ['4821', '3175', '9026', '6643', '2398', '7510'];
  const orderIns = db.prepare(
    'INSERT INTO orders (id, household_id, litres, otp, status) VALUES (?,?,?,?,?)',
  );
  households.forEach((row, i) => {
    orderIns.run(`ORD-${i + 1}`, row.id, Math.round(row.tank * 0.7), otps[i], 'PENDING');
  });

  const poolIns = db.prepare(
    'INSERT INTO pools (id,name,zone,target_members,target_litres,cost_per_litre,standard_cost_per_litre,refill_eta,lat,lon) VALUES (?,?,?,?,?,?,?,?,?,?)',
  );
  const pools = [
    ['P-01', 'Banjara Hills Block-4 Pool', 'Banjara Hills', 8, 10000, 0.31, 0.45, 'Tomorrow · 6:00 AM', 17.4255, 78.4205],
    ['P-02', 'Jubilee Hills Civic Pool', 'Jubilee Hills', 8, 10000, 0.33, 0.45, 'Day after · 6:00 AM', 17.43, 78.429],
    ['P-03', 'Film Nagar Apartments Pool', 'Film Nagar', 8, 10000, 0.29, 0.45, 'Today · 2:00 PM', 17.417, 78.422],
  ] as const;
  for (const p of pools) poolIns.run(...p);

  db.prepare('INSERT INTO pool_members VALUES (?,?)').run('P-01', 'H-1014');
  for (const hid of ['H-3087', 'H-5601', 'H-6712', 'H-4052']) {
    db.prepare('INSERT INTO pool_members VALUES (?,?)').run('P-01', hid);
  }
}

function buildSeedRun() {
  const orders = db
    .prepare(
      `SELECT o.id, o.litres, o.otp, h.id AS householdId, h.name AS householdName, h.address,
              h.floor, h.landmark, h.lat, h.lon, h.bookings_last_30_days, h.hours_without_water, h.critical_need,
              h.tank_capacity_litres
       FROM orders o JOIN households h ON h.id = o.household_id
       WHERE o.status = 'PENDING'`,
    )
    .all() as {
    id: string; litres: number; otp: string; householdId: string; householdName: string;
    address: string; floor: string; landmark: string; lat: number; lon: number;
    bookings_last_30_days: number; hours_without_water: number; critical_need: number; tank_capacity_litres: number;
  }[];

  const pending = orders.map((o) => ({
    id: o.id,
    householdId: o.householdId,
    householdName: o.householdName,
    address: o.address,
    floor: o.floor,
    landmark: o.landmark,
    litres: o.litres,
    lat: o.lat,
    lon: o.lon,
    score: fairShareScore({
      hoursWithoutWater: o.hours_without_water,
      criticalNeed: Boolean(o.critical_need),
      recentBookings30Days: o.bookings_last_30_days,
    }),
    otp: o.otp,
  }));

  const run = planLoad(pending);
  const now = Date.now();
  const id = `RUN-${String(now).slice(-3)}${Math.floor(Math.random() * 90 + 10)}`;

  db.prepare(
    `INSERT INTO delivery_runs
       (id, load_id, tanker_id, capacity_litres, total_litres, cluster_lat, cluster_lon,
        radius_km, total_distance_km, status, source_borewell, stops_json)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id, run.loadId, 'T-107', run.capacityLitres, run.totalLitresLoaded,
    run.clusterCentre.lat, run.clusterCentre.lon, run.radiusKm, run.totalDistanceKm,
    'ON_ROUTE', 'Hafeezpet Borewell 7', JSON.stringify(run.stops),
  );

  const update = db.prepare('UPDATE orders SET run_id = ?, stop_index = ? WHERE id = ?');
  run.stops.forEach((s) => update.run(id, s.index, s.orderId));

  return id;
}

export function seedIfEmpty(): void {
  const count = db.prepare('SELECT COUNT(*) AS c FROM households').get() as { c: number };
  if (count.c > 0) return;
  const tx = db.transaction(() => {
    seed();
    buildSeedRun();
  });
  tx();
  console.log('[hydroflow] database seeded at', DB_PATH);
}

export function resetAndSeed(): void {
  db.exec('DELETE FROM pool_members; DELETE FROM delivery_runs; DELETE FROM orders; DELETE FROM pools; DELETE FROM tankers; DELETE FROM drivers; DELETE FROM borewells; DELETE FROM households;');
  seedIfEmpty();
}