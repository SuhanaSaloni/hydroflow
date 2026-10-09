import cors from 'cors';
import express from 'express';
import { db, seedIfEmpty } from './db';
import { CLUSTER_RADIUS_KM } from './config';
import {
  buildRequest,
  fairShareScore,
  type PriorityRequest,
} from './services/priorityService';
import {
  dailyDepletion,
  forecastLevel,
  seasonalHeatFactor,
} from './services/estimatorService';
import {
  kmBetween,
  planLoad,
  type PendingOrder,
} from './services/routingService';

seedIfEmpty();

const app = express();
const api = express.Router();
const ejson = express.json();
app.use(cors());
app.use(ejson);

const STANDARD_RATE = 0.45;

const round2 = (n: number) => Math.round(n * 100) / 100;

const camel = <T,>(row: Record<string, unknown>): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/_([A-Za-z0-9])/g, (_, c: string) => c.toUpperCase());
    out[key] = v;
  }
  return out as T;
};

interface HouseholdRow {
  id: string;
  name: string;
  occupants: number;
  tankCapacityLitres: number;
  currentLevelLitres: number;
  address: string;
  floor: string;
  landmark: string;
  lat: number;
  lon: number;
  bookingsLast30Days: number;
  hoursWithoutWater: number;
  criticalNeed: number;
}

const getHouseholds = () =>
  db.prepare('SELECT * FROM households').all().map((r) => camel<HouseholdRow>(r as Record<string, unknown>));

const getPoolPrice = (homeId: string) =>
  db
    .prepare(
      `SELECT p.cost_per_litre FROM pools p
       JOIN pool_members pm ON pm.pool_id = p.id
       WHERE pm.household_id = ?`,
    )
    .get(homeId) as { cost_per_litre: number } | undefined;

function queue(): PriorityRequest[] {
  return getHouseholds()
    .map((h) => {
      const score = fairShareScore({
        hoursWithoutWater: h.hoursWithoutWater,
        criticalNeed: Boolean(h.criticalNeed),
        recentBookings30Days: h.bookingsLast30Days,
      });
      return { h, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ h }, idx) =>
      buildRequest(
        {
          id: h.id,
          name: h.name,
          address: h.address,
          tankCapacityLitres: h.tankCapacityLitres,
          hoursWithoutWater: h.hoursWithoutWater,
          criticalNeed: Boolean(h.criticalNeed),
          bookingsLast30Days: h.bookingsLast30Days,
        },
        idx + 1,
      ),
    );
}

api.get('/health', (_req, res) => {
  const dbOk = (() => {
    try {
      db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  })();
  res.json({ ok: dbOk, db: 'better-sqlite3', engine: 'express' });
});

api.get('/estimator/depletion', (req, res) => {
  const occupants = Number(req.query.occupants ?? 4);
  const month = Number(req.query.month ?? new Date().getMonth());
  const heatFactor = Number(req.query.heatFactor ?? seasonalHeatFactor(month));
  res.json(dailyDepletion({ occupants, heatFactor, month }));
});

api.get('/estimator/forecast', (req, res) => {
  const homeId = String(req.query.homeId ?? '');
  const home = getHouseholds().find((h) => h.id === homeId);
  if (!home) return res.status(404).json({ error: 'household not found' });
  const depletion = dailyDepletion({
    occupants: home.occupants,
    month: new Date().getMonth(),
  });
  res.json(
    forecastLevel(home.currentLevelLitres, home.tankCapacityLitres, depletion),
  );
});

api.get('/priority/queue', (_req, res) => {
  res.json(queue());
});

api.get('/bookings/preview', (req, res) => {
  const homeId = String(req.query.homeId ?? '');
  const request = queue().find((q) => q.householdId === homeId);
  if (!request) return res.status(404).json({ error: 'household not found' });
  const poolPrice = getPoolPrice(homeId);
  res.json({
    request,
    slots: [
      { date: 'Today', window: '2:30 – 4:30 PM' },
      { date: 'Today', window: '6:00 – 8:00 PM' },
      { date: 'Tomorrow', window: '6:00 – 8:00 AM' },
    ],
    poolActive: Boolean(poolPrice),
    pricePerLitre: poolPrice?.cost_per_litre ?? STANDARD_RATE,
    standardPricePerLitre: STANDARD_RATE,
    surgeFactor: 1.0,
    creditScored: true,
  });
});

api.post('/bookings', (req, res) => {
  const { homeId, litres } = req.body as { homeId?: string; litres?: number };
  const home = getHouseholds().find((h) => h.id === homeId);
  if (!home || !litres) return res.status(400).json({ error: 'homeId and litres required' });
  const id = `ORD-${Date.now()}`;
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  db.prepare('INSERT INTO orders (id, household_id, litres, otp) VALUES (?,?,?,?)').run(
    id,
    homeId,
    litres,
    otp,
  );
  const line = queue().findIndex((q) => q.householdId === homeId) + 1;
  res.status(201).json({ bookingRef: `BW-2026-${String(Date.now()).slice(-4)}`, queueLine: line, otp });
});

api.get('/passport/:homeId', (req, res) => {
  const borewell = db.prepare('SELECT * FROM borewells WHERE id = ?').get('BW-07') as Record<string, unknown>;
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get('D-5') as Record<string, unknown>;
  const tanker = db.prepare('SELECT * FROM tankers WHERE id = ?').get('T-107') as Record<string, unknown>;
  const b = camel<{ id: string; name: string; location: string; tdsPpm: number; ph: number; verified: number; yieldLph: number; lastTestedAt: string }>(borewell);
  res.json({
    householdId: req.params.homeId,
    borewell: { ...b, verified: Boolean(b.verified) },
    driver: {
      name: driver.name,
      phone: driver.phone,
      safetyRating: driver.safety_rating,
      tripsToday: driver.trips_today,
      photoEmoji: driver.photo_emoji,
    },
    vehicle: {
      plate: tanker.plate,
      capacityLitres: tanker.capacity_litres,
      lastSafetyInspection: '2026-08-20',
    },
    lastTdsPpm: b.tdsPpm,
    labCertified: true,
    pipelineRefill: false,
  });
});

api.get('/pools', (req, res) => {
  const homeId = String(req.query.homeId ?? '');
  const home = getHouseholds().find((h) => h.id === homeId);
  const pools = db
    .prepare(
      `SELECT p.*,
              (SELECT COUNT(*) FROM pool_members pm WHERE pm.pool_id = p.id) AS members_count,
              (SELECT COUNT(*) FROM pool_members pm WHERE pm.pool_id = p.id AND pm.household_id = ?) AS joined
       FROM pools p`,
    )
    .all(homeId || '') as Record<string, unknown>[];

  const out = pools
    .map((p) => {
      const base = camel<{
        id: string;
        name: string;
        zone: string;
        targetMembers: number;
        targetLitres: number;
        costPerLitre: number;
        standardCostPerLitre: number;
        refillEta: string;
        lat: number;
        lon: number;
        membersCount: number;
        joined: number;
      }>(p);
      const distanceKm = home
        ? kmBetween(home.lat, home.lon, base.lat, base.lon)
        : 0;
      return {
        ...base,
        joined: Boolean(base.joined),
        committedLitres:
          (base.membersCount / base.targetMembers) * base.targetLitres,
        savingsPerLitre: round2(base.standardCostPerLitre - base.costPerLitre),
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(out);
});

api.post('/pools/:poolId/join', (req, res) => {
  const { homeId } = req.body as { homeId?: string };
  if (!homeId) return res.status(400).json({ error: 'homeId required' });
  const pool = db.prepare('SELECT id FROM pools WHERE id = ?').get(req.params.poolId);
  if (!pool) return res.status(404).json({ error: 'pool not found' });
  db.prepare('INSERT OR IGNORE INTO pool_members (pool_id, household_id) VALUES (?,?)').run(
    req.params.poolId,
    homeId,
  );
  const updated = db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM pool_members pm WHERE pm.pool_id = p.id) AS members_count,
              (SELECT COUNT(*) FROM pool_members pm WHERE pm.pool_id = p.id AND pm.household_id = ?) AS joined
       FROM pools p WHERE p.id = ?`,
    )
    .get(homeId, req.params.poolId) as Record<string, unknown>;
  const base = camel<{
    id: string;
    name: string;
    zone: string;
    targetMembers: number;
    targetLitres: number;
    costPerLitre: number;
    standardCostPerLitre: number;
    refillEta: string;
    lat: number;
    lon: number;
    membersCount: number;
    joined: number;
  }>(updated);
  res.json({
    ...base,
    joined: Boolean(base.joined),
    committedLitres: (base.membersCount / base.targetMembers) * base.targetLitres,
    savingsPerLitre: round2(base.standardCostPerLitre - base.costPerLitre),
    distanceKm: 0,
  });
});

interface RunRow {
  id: string;
  load_id: string;
  tanker_id: string;
  capacity_litres: number;
  total_litres: number;
  cluster_lat: number;
  cluster_lon: number;
  radius_km: number;
  total_distance_km: number;
  status: string;
  source_borewell: string;
  stops_json: string;
}

function persistRun() {
  const pending = pendingOrders();
  const planned = planLoad(pending, 10000, CLUSTER_RADIUS_KM);
  const id = `RUN-${Date.now().toString().slice(-3)}${Math.floor(Math.random() * 90 + 10)}`;
  db.prepare(
    `INSERT INTO delivery_runs
       (id, load_id, tanker_id, capacity_litres, total_litres, cluster_lat, cluster_lon,
        radius_km, total_distance_km, status, source_borewell, stops_json)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id, planned.loadId, 'T-107', planned.capacityLitres, planned.totalLitresLoaded,
    planned.clusterCentre.lat, planned.clusterCentre.lon, planned.radiusKm,
    planned.totalDistanceKm, 'ON_ROUTE', 'Hafeezpet Borewell 7', JSON.stringify(planned.stops),
  );
  const update = db.prepare('UPDATE orders SET run_id = ?, stop_index = ? WHERE id = ?');
  planned.stops.forEach((s) => update.run(id, s.index, s.orderId));
  return { dbRow: db.prepare('SELECT * FROM delivery_runs WHERE id = ?').get(id) as RunRow, planned };
}

function pendingOrders(): PendingOrder[] {
  const rows = db
    .prepare(
      `SELECT o.id, o.litres, o.otp, h.id AS householdId, h.name AS householdName, h.address,
              h.floor, h.landmark, h.lat, h.lon, h.bookings_last_30_days, h.hours_without_water, h.critical_need
       FROM orders o JOIN households h ON h.id = o.household_id
       WHERE o.status = 'PENDING'`,
    )
    .all() as {
      id: string; litres: number; otp: string; householdId: string; householdName: string;
      address: string; floor: string; landmark: string; lat: number; lon: number;
      bookings_last_30_days: number; hours_without_water: number; critical_need: number;
    }[];
  return rows.map((o) => ({
    id: o.id,
    householdId: o.householdId,
    householdName: o.householdName,
    address: o.address,
    floor: o.floor,
    landmark: o.landmark,
    litres: o.litres,
    lat: o.lat,
    lon: o.lon,
    otp: o.otp,
    score: fairShareScore({
      hoursWithoutWater: o.hours_without_water,
      criticalNeed: Boolean(o.critical_need),
      recentBookings30Days: o.bookings_last_30_days,
    }),
  }));
}

function runJson(row: RunRow) {
  const stops = JSON.parse(row.stops_json) as PendingOrder[];
  return {
    id: row.id,
    loadId: row.load_id,
    tankerId: row.tanker_id,
    plate: 'TS 09 EX 4714',
    driverName: 'Ramesh Goud',
    capacityLitres: row.capacity_litres,
    totalLitresLoaded: row.total_litres,
    clusterCentre: { lat: row.cluster_lat, lon: row.cluster_lon },
    radiusKm: row.radius_km,
    totalDistanceKm: row.total_distance_km,
    status: row.status,
    sourceBorewell: row.source_borewell,
    stops,
  };
}

api.get('/deliveries/active', (_req, res) => {
  const active = db
    .prepare(`SELECT * FROM delivery_runs WHERE status = 'ON_ROUTE' ORDER BY created_at DESC LIMIT 1`)
    .get() as RunRow | undefined;
  if (active) return res.json(runJson(active));
  persistRun();
  const row = db.prepare('SELECT * FROM delivery_runs ORDER BY created_at DESC LIMIT 1').get() as RunRow;
  res.json(runJson(row));
});

api.post('/deliveries/plan', (_req, res) => {
  const planned = planLoad(pendingOrders(), 10000, CLUSTER_RADIUS_KM);
  res.json({ loadId: planned.loadId, stops: planned.stops.length, litres: planned.totalLitresLoaded });
});

api.post('/deliveries/:runId/stop/:index/verify', (req, res) => {
  const { otp } = req.body as { otp?: string };
  const run = db.prepare('SELECT * FROM delivery_runs WHERE id = ?').get(req.params.runId) as RunRow | undefined;
  if (!run) return res.status(404).json({ error: 'run not found' });

  const stops = JSON.parse(run.stops_json) as {
    index: number; orderId: string; litres: number; otp: string; status: string; remainingAfterStop: number;
  }[];
  const stop = stops.find((s) => s.index === Number(req.params.index));
  if (!stop) return res.status(404).json({ error: 'stop not found' });

  if (stop.otp !== otp) return res.status(400).json({ verified: false, error: 'otp mismatch' });

  stop.status = 'DELIVERED';
  const next = stops.find((s) => s.index === stop.index + 1);
  if (next) next.status = 'IN_TRANSIT';

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('DELIVERED', stop.orderId);
  db.prepare('UPDATE delivery_runs SET stops_json = ?, status = ? WHERE id = ?').run(
    JSON.stringify(stops),
    stops.every((s) => s.status === 'DELIVERED') ? 'COMPLETED' : 'ON_ROUTE',
    req.params.runId,
  );
  res.json({ verified: true, remainingLitres: stop.remainingAfterStop });
});

app.use('/api', api);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[hydroflow] API listening on http://localhost:${PORT}`);
  console.log(`[hydroflow] GET /api/health · /api/priority/queue · /api/deliveries/active`);
});