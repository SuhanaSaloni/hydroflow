export const STANDARD_CAPITA_LITRES = 135;

export interface HeatFactorInputs {
  month: number; // 0-based
}

/**
 * Seasonal heat factor (0 → 0.4) applies a k-factor on top of the per-capita
 * standard consumption. April–June (peak summer) consume ~40% more water.
 */
export function seasonalHeatFactor(month: number): number {
  if (month >= 4 && month <= 6) return 0.4;
  if (month === 3 || month === 7) return 0.25;
  if (month === 2 || month === 8) return 0.1;
  return 0;
}

export interface DepletionInput {
  occupants: number;
  heatFactor?: number;
  month?: number;
}

export interface DepletionResult {
  occupants: number;
  heatFactor: number;
  capitaLitres: number;
  dailyDepletionLitres: number;
  weeklyDepletionLitres: number;
}

/**
 * Daily Depletion (L) = (Family_Members * 135L standard) * (1 + Summer_Heat_Factor)
 */
export function dailyDepletion(input: DepletionInput): DepletionResult {
  const heatFactor =
    input.heatFactor ?? seasonalHeatFactor(input.month ?? new Date().getMonth());
  const daily = input.occupants * STANDARD_CAPITA_LITRES * (1 + heatFactor);
  return {
    occupants: input.occupants,
    heatFactor,
    capitaLitres: STANDARD_CAPITA_LITRES,
    dailyDepletionLitres: Math.round(daily),
    weeklyDepletionLitres: Math.round(daily * 7),
  };
}

export interface ForecastResult {
  currentLitres: number;
  capacityLitres: number;
  dailyDepletionLitres: number;
  daysUntilEmpty: number;
  health: 'GOOD' | 'WATCH' | 'CRITICAL';
}

export function forecastLevel(
  currentLitres: number,
  capacityLitres: number,
  depletion: DepletionResult,
): ForecastResult {
  const daysUntilEmpty =
    depletion.dailyDepletionLitres > 0
      ? Math.round((currentLitres / depletion.dailyDepletionLitres) * 10) / 10
      : 0;
  const pct = (currentLitres / capacityLitres) * 100;
  return {
    currentLitres,
    capacityLitres,
    dailyDepletionLitres: depletion.dailyDepletionLitres,
    daysUntilEmpty,
    health: pct > 35 ? 'GOOD' : pct > 18 ? 'WATCH' : 'CRITICAL',
  };
}