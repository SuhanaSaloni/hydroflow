# HydroFlow

**Predictive, fair, and shared water tanker dispatch for every household.**

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-NativeWind-38B2AC?logo=tailwind-css&logoColor=white)](https://www.nativewind.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## The Problem

Urban water tanker supply is a **reactive, opaque, and unfair** market:

- **You don't know when you'll run dry.** Households only order water *after* the tap stops, not before. There is no forecast, so people guess and either over-order (wasteful) or panic-order in a crisis.
- **Whoever calls first wins.** Dispatch is first-come-first-served, so a family of 9 with infants and an elderly resident who has been dry for 66 hours waits behind a household that ordered twice this week.
- **Tankers run inefficient routes.** A single 10,000 L tanker crosses the city for one house, then returns — burning fuel and time that could serve the whole street.
- **Everyone overpays.** No household has bargaining power alone, so they pay the full spot rate per litre with no transparency into where the water actually came from.
- **No trust in the source.** Residents can't verify the borewell, TDS, or the vehicle that delivered their water.

**HydroFlow is needed** because water is a lifeline, not a luxury good. A system that *predicts* depletion, *prioritizes* by genuine need, *clusters* deliveries into shared routes, and *proves* source quality turns a chaotic market into a fair utility — while cutting cost and fuel for operators and residents alike.

---

## Key Novel Features

### 1. Sensorless Tank Consumption Estimator
No IoT sensor, float switch, or hardware required. HydroFlow infers tank depletion from household metadata and the calendar.

```
Daily Depletion (L) = (Family_Members × 135 L per-capita standard) × (1 + Summer_Heat_Factor)
```

- **Seasonal heat factor** applies a k-factor on top of the WHO-style 135 L/capita baseline — April–June (peak summer) consume ~40% more, with tapered shoulders around the peak (`server/src/services/estimatorService.ts:11`).
- The server returns a **days-until-empty forecast** and a `GOOD / WATCH / CRITICAL` tank health band that drives the UI's proactive reorder prompt (`server/src/services/estimatorService.ts:56`).
- The same math runs client-side in `src/lib/estimator.ts`, so the app still forecasts when the API is offline.

### 2. Fair-Share Priority Queue Algorithm
A transparent, auditable scoring function replaces "first call, first served."

```
Score = (Hours_Without_Water × 1.5) + (Critical_Need × 2.0) − (Recent_Bookings_30Days × 0.8)
```

- **Need raises your score, hoarding lowers it.** The negative weight on recent bookings explicitly de-prioritizes households that order repeatedly, so supply rotates fairly.
- Requests are classified into **HIGH / MEDIUM / REGULAR** dispatch tiers and given a live queue position (`server/src/services/priorityService.ts:22`).
- Weights are named constants, so the policy is tunable and explainable to residents — the app surfaces *why* a household holds its rank.

### 3. Shared Fleet Multi-Stop Route Splitting
One tanker, many homes — clustered, capacity-bounded, and ordered into a driveable route.

- **Priority-seeded clustering:** the highest fair-share request seeds a cluster, then nearby pending orders within a 2 km radius are greedily pulled in until the tanker's 10,000 L capacity is reached (`server/src/services/routingService.ts:64`).
- **Nearest-neighbour routing** from the cluster centroid orders the stops, computing per-stop ETAs and remaining litres after each drop (`server/src/services/routingService.ts:91`).
- Uses **Turf.js** geodesic distance for accurate km math, and persists each run with its stop list to SQLite so the driver screen reflects a real dispatch plan.
- **OTP-gated proof of delivery** advances the run stop-by-stop and marks orders `DELIVERED` (`server/src/index.ts:379`).

### 4. Digital Water Passport
Every delivery carries a verifiable provenance record — a "passport" for your water.

- Bundles the **source borewell** (TDS ppm, pH, verified flag, yield), the **driver** (safety rating, trips today), and the **vehicle** (plate, capacity, last safety inspection) into one shareable card (`server/src/index.ts:169`).
- `labCertified` / `verified` badges give residents auditable trust in a traditionally opaque supply chain. Rendered by `src/components/WaterPassportCard.tsx`.

### 5. Community Bulk Demand Pools
Neighbours aggregate demand to unlock wholesale tanker pricing.

- Each pool targets 8 members and 10,000 L (one full tanker). Progress is shown live, and committed litres are tracked per pool (`server/src/index.ts:195`).
- Joining a pool flips the household's booking price from the standard `0.45`/L spot rate to the pool's bulk rate (e.g. `0.29–0.33`/L), with `savingsPerLitre` computed and displayed (`server/src/index.ts:231`).
- Pools are sorted by distance so the nearest block-order is always surfaced first (`src/app/(tabs)/pool.tsx`).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile app | React Native 0.86 + Expo SDK 57 (Expo Router, typed routes) |
| Styling | NativeWind (Tailwind CSS for React Native) |
| UI / Icons | lucide-react-native, react-native-svg, Reanimated |
| API | Node.js + Express 5 (TypeScript, run with `tsx`) |
| Database | SQLite via `better-sqlite3` (WAL mode, auto-seeded) |
| Geo / Routing | Turf.js (`@turf/distance`, `@turf/helpers`) |

---

## Local Setup & Execution

### Prerequisites
- **Node.js 18+** and npm
- **Expo Go** app on your phone, or an Android/iOS emulator
- A C/C++ build toolchain for `better-sqlite3` (prebuilt binaries cover most systems)

### 1. Install everything
```bash
npm run setup
```
This installs the Expo app and the server, then seeds the demo database (households, tanker, driver, borewell, pools, and an active delivery run).

### 2. Run the full stack
```bash
npm run dev
```
`npm run dev` launches **both** processes together via `concurrently`:
- **EXPO** — the Expo dev server (Metro bundler)
- **API** — the Express server on `http://localhost:4000`

Then press `a` (Android), `i` (iOS), or `w` (web) in the Expo terminal, or scan the QR code with Expo Go.

> **Physical device?** Android emulators reach the host at `10.0.2.2`; when testing on a real phone set your machine's LAN IP, e.g.
> `EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npm run dev`

### Individual commands
```bash
npm start          # Expo dev client only
npm run server     # Express API only (http://localhost:4000)
npm run seed       # reset and reseed the demo database
npm run lint       # ESLint (expo lint)
npm run typecheck  # tsc --noEmit
```

### Verify the API
```bash
curl http://localhost:4000/api/health
curl "http://localhost:4000/api/priority/queue?homeId=H-1014"
curl http://localhost:4000/api/deliveries/active
```

The app is **offline-tolerant**: if the API doesn't respond within 1.2 s, screens fall back to seeded mock data so a demo never breaks on stage (`src/lib/api.ts:49`).

---

## Project Directory Structure

```
hydroflow/
├── app.json                   # Expo config (name, scheme, icons, plugins)
├── package.json               # Root scripts: dev, setup, seed, lint, typecheck
├── scripts/
│   └── setup.mjs              # One-shot installer + seeder
├── server/                    # Express + SQLite dispatch backend
│   ├── data/                  # Generated SQLite database (hydroflow.db)
│   └── src/
│       ├── config.ts          # Port, DB path, tanker capacity, cluster radius
│       ├── db.ts              # Schema, seed data, reset helpers
│       ├── seed.ts            # Standalone seed entrypoint
│       ├── index.ts           # All API routes (/api/*)
│       └── services/
│           ├── estimatorService.ts  # Sensorless depletion & forecast
│           ├── priorityService.ts   # Fair-share scoring & tiers
│           └── routingService.ts    # Clustering + multi-stop route planning
└── src/                       # Expo / React Native app
    ├── app/                   # Expo Router screens (file-based routes)
    │   ├── _layout.tsx        # Root stack navigator
    │   ├── (tabs)/
    │   │   ├── _layout.tsx    # Bottom tab navigator
    │   │   ├── index.tsx      # Consumer dashboard (tank, forecast, queue)
    │   │   ├── driver.tsx     # Driver route + OTP delivery flow
    │   │   └── pool.tsx       # Community supply pools
    │   ├── book.tsx           # Booking modal (slots, price, pool savings)
    │   └── passport.tsx       # Digital Water Passport modal
    ├── components/            # Reusable UI (TankMeter, PriorityBadge, ...)
    ├── constants/             # App constants (API base, IDs) & theme
    ├── data/                  # Offline mock fallback data
    ├── lib/                   # API client, estimator, priority, formatting
    └── types/                 # Shared TypeScript domain types
```

---

## API Overview

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness + DB check |
| GET | `/api/estimator/depletion` | Daily/weekly depletion for occupants |
| GET | `/api/estimator/forecast` | Days-until-empty + tank health |
| GET | `/api/priority/queue` | Fair-share ranked dispatch queue |
| GET | `/api/bookings/preview` | Slots, pricing, pool savings |
| POST | `/api/bookings` | Create an order (returns OTP) |
| GET | `/api/passport/:homeId` | Digital Water Passport |
| GET | `/api/pools` | Nearby demand pools |
| POST | `/api/pools/:poolId/join` | Join a pool |
| GET | `/api/deliveries/active` | Current multi-stop run |
| POST | `/api/deliveries/plan` | Re-plan a load |
| POST | `/api/deliveries/:runId/stop/:index/verify` | OTP delivery confirmation |

---

Built for hackathon speed: `npm run setup` then `npm run dev`, and the whole water loop — forecast, queue, pool, route, deliver — is live.
