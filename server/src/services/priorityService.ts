export type DispatchTier = 'HIGH' | 'MEDIUM' | 'REGULAR';

export interface PriorityInput {
  hoursWithoutWater: number;
  criticalNeed: boolean;
  recentBookings30Days: number;
}

export interface PriorityRequest {
  householdId: string;
  householdName: string;
  address: string;
  requestedLitres: number;
  score: number;
  tier: DispatchTier;
  hoursWithoutWater: number;
  criticalNeed: boolean;
  recentBookings30d: number;
  linePosition: number;
}

export const W_HOURS_WITHOUT_WATER = 1.5;
export const W_CRITICAL_NEED = 2.0;
export const W_RECENT_BOOKINGS = 0.8;

/**
 * Fair-Share Priority Score
 * Score = (Hours_Without_Water * 1.5) + (Critical_Need * 2.0) - (Recent_Bookings_30Days * 0.8)
 */
export function fairShareScore(input: PriorityInput): number {
  return (
    input.hoursWithoutWater * W_HOURS_WITHOUT_WATER +
    (input.criticalNeed ? 1 : 0) * W_CRITICAL_NEED -
    input.recentBookings30Days * W_RECENT_BOOKINGS
  );
}

export function classifyTier(score: number): DispatchTier {
  if (score >= 30) return 'HIGH';
  if (score >= 12) return 'MEDIUM';
  return 'REGULAR';
}

export function buildRequest(
  row: {
    id: string;
    name: string;
    address: string;
    tankCapacityLitres: number;
    hoursWithoutWater: number;
    criticalNeed: boolean;
    bookingsLast30Days: number;
  },
  linePosition: number,
): PriorityRequest {
  const score = fairShareScore({
    hoursWithoutWater: row.hoursWithoutWater,
    criticalNeed: row.criticalNeed,
    recentBookings30Days: row.bookingsLast30Days,
  });
  return {
    householdId: row.id,
    householdName: row.name,
    address: row.address,
    requestedLitres: Math.round(row.tankCapacityLitres * 0.7),
    score: Math.round(score * 10) / 10,
    tier: classifyTier(score),
    hoursWithoutWater: row.hoursWithoutWater,
    criticalNeed: row.criticalNeed,
    recentBookings30d: row.bookingsLast30Days,
    linePosition,
  };
}