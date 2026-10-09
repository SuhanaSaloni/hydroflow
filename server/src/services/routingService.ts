import { point } from '@turf/helpers';
import distance from '@turf/distance';
import { CLUSTER_RADIUS_KM, TANKER_CAPACITY_LITRES } from '../config';

export interface PendingOrder {
  id: string;
  householdId: string;
  householdName: string;
  address: string;
  floor: string;
  landmark: string;
  litres: number;
  lat: number;
  lon: number;
  score: number;
  otp: string;
}

export interface PlannedStop {
  index: number;
  orderId: string;
  householdId: string;
  householdName: string;
  address: string;
  floor: string;
  landmark: string;
  litres: number;
  remainingAfterStop: number;
  lat: number;
  lon: number;
  etaMinutes: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  otp: string;
}

export interface PlannedRun {
  loadId: string;
  tankerId: string;
  capacityLitres: number;
  totalLitresLoaded: number;
  clusterCentre: { lat: number; lon: number };
  radiusKm: number;
  totalDistanceKm: number;
  stops: PlannedStop[];
}

export function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return distance(point([lon1, lat1]), point([lon2, lat2]), { units: 'kilometers' });
}

function centroid(pts: { lat: number; lon: number }[]) {
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  return { lat, lon };
}

/**
 * Builds a single feasible tanker load:
 *  1. Seed the cluster with the highest fair-share request.
 *  2. Greedily pull in the nearest pending orders within `radiusKm`,
 *     stopping at `capacityLitres`.
 *  3. Order the stops with a nearest-neighbour route from the cluster centroid.
 */
export function planLoad(
  pending: PendingOrder[],
  capacityLitres: number = TANKER_CAPACITY_LITRES,
  radiusKm: number = CLUSTER_RADIUS_KM,
): PlannedRun {
  const ordered = [...pending].sort((a, b) => b.score - a.score);
  let cluster: PendingOrder[] = [];
  let remainingCapacity = capacityLitres;

  for (const candidate of ordered) {
    if (candidate.litres > remainingCapacity) continue;
    const centre = centroid([...cluster, candidate]);
    const withinRadius = cluster.every(
      (c) => kmBetween(centre.lat, centre.lon, c.lat, c.lon) <= radiusKm,
    );
    if (!withinRadius) continue;
    cluster.push(candidate);
    remainingCapacity -= candidate.litres;
    if (remainingCapacity <= 0) break;
  }

  if (cluster.length === 0 && pending.length > 0) {
    cluster = [ordered[0]];
  }

  const centre = centroid(cluster);

  const route: PendingOrder[] = [];
  const unvisited = [...cluster];
  let currentLat = centre.lat;
  let currentLon = centre.lon;
  while (unvisited.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = kmBetween(currentLat, currentLon, unvisited[i].lat, unvisited[i].lon);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    route.push(unvisited[bestIdx]);
    currentLat = unvisited[bestIdx].lat;
    currentLon = unvisited[bestIdx].lon;
    unvisited.splice(bestIdx, 1);
  }

  let remaining = capacityLitres;
  let totalDistanceKm = 0;
  let prev: { lat: number; lon: number } = centre;
  const stops: PlannedStop[] = route.map((o, i) => {
    remaining -= o.litres;
    totalDistanceKm += kmBetween(prev.lat, prev.lon, o.lat, o.lon);
    prev = o;
    return {
      index: i + 1,
      orderId: o.id,
      householdId: o.householdId,
      householdName: o.householdName,
      address: o.address,
      floor: o.floor,
      landmark: o.landmark,
      litres: o.litres,
      remainingAfterStop: remaining,
      lat: o.lat,
      lon: o.lon,
      etaMinutes: Math.round(totalDistanceKm * 9 + 6 + i * 8),
      status: i === 0 ? 'IN_TRANSIT' : 'PENDING',
      otp: o.otp,
    };
  });

  const maxRadius = cluster.reduce(
    (m, o) => Math.max(m, kmBetween(centre.lat, centre.lon, o.lat, o.lon)),
    0,
  );

  return {
    loadId: `LD-${Math.floor(4000 + Math.random() * 999)}`,
    tankerId: 'T-107',
    capacityLitres,
    totalLitresLoaded: cluster.reduce((s, o) => s + o.litres, 0),
    clusterCentre: centre,
    radiusKm: Math.round(maxRadius * 10) / 10,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    stops,
  };
}