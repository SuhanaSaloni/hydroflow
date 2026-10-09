import type { DispatchTier, HouseholdProfile, PriorityRequest } from '@/types';

export const W_HR_WITHOUT_WATER = 1.5;
export const W_CRITICAL_NEED = 2.0;
export const W_RECENT_BOOKINGS = 0.8;

export function criticalMultiplier(household: Pick<HouseholdProfile, 'criticalNeed'>): number {
  return household.criticalNeed ? 1 : 0;
}

/**
 * Fair-Share Priority Score
 * Score = (Hours_Without_Water * 1.5) + (Critical_Need_Multiplier * 2.0) - (Recent_Bookings_30Days * 0.8)
 */
export function fairShareScore(
  hoursWithoutWater: number,
  criticalNeed: boolean,
  recentBookings30Days: number,
): number {
  return (
    hoursWithoutWater * W_HR_WITHOUT_WATER +
    criticalMultiplier({ criticalNeed }) * W_CRITICAL_NEED -
    recentBookings30Days * W_RECENT_BOOKINGS
  );
}

export function tierForScore(score: number): DispatchTier {
  if (score >= 30) return 'HIGH';
  if (score >= 12) return 'MEDIUM';
  return 'REGULAR';
}

export function buildPriorityRequest(
  household: HouseholdProfile,
  linePosition: number,
): PriorityRequest {
  const score = fairShareScore(
    household.hoursWithoutWater,
    household.criticalNeed,
    household.bookingsLast30Days,
  );
  return {
    householdId: household.id,
    householdName: household.name,
    address: household.address,
    requestedLitres: Math.round(household.tankCapacityLitres * 0.7),
    score: Math.round(score * 10) / 10,
    tier: tierForScore(score),
    hoursWithoutWater: household.hoursWithoutWater,
    criticalNeed: household.criticalNeed,
    recentBookings30d: household.bookingsLast30Days,
    linePosition,
  };
}

export function sortByPriority(households: HouseholdProfile[]): PriorityRequest[] {
  return households
    .map((h, i) => ({
      household: h,
      score: fairShareScore(h.hoursWithoutWater, h.criticalNeed, h.bookingsLast30Days),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ household }, i) => buildPriorityRequest(household, i + 1));
}