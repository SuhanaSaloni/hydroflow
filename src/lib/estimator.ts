import type { WaterLevelForecast } from '@/types';

export const STANDARD_CAPITA_LITRES = 135;

// 0.0 (cool) -> 0.45 (scorching summers). Industry-grade seasonal heat factor.
export function seasonalHeatFactor(monthIndex = new Date().getMonth()): number {
  if (monthIndex >= 4 && monthIndex <= 6) return 0.4; // Apr-Jun (peak summer)
  if (monthIndex === 3 || monthIndex === 7) return 0.25; // Mar & Jul (shoulders)
  if (monthIndex === 2 || monthIndex === 8) return 0.1; // Feb & Aug
  return 0; // Monsoon / cool months
}

export function dailyDepletion(
  occupants: number,
  heatFactor: number,
): number {
  return occupants * STANDARD_CAPITA_LITRES * (1 + heatFactor);
}

export function tankHealth(levelPct: number): WaterLevelForecast['health'] {
  if (levelPct > 35) return 'GOOD';
  if (levelPct > 18) return 'WATCH';
  return 'CRITICAL';
}

export function forecast(
  currentLitres: number,
  capacityLitres: number,
  occupants: number,
  heatFactor: number,
): WaterLevelForecast {
  const perDay = dailyDepletion(occupants, heatFactor);
  const daysUntilEmpty = perDay > 0 ? Math.floor(currentLitres / perDay * 10) / 10 : 0;
  return {
    currentLitres,
    capacityLitres,
    occupants,
    heatFactor,
    dailyDepletionLitres: Math.round(perDay),
    daysUntilEmpty,
    warningAtLitres: capacityLitres * 0.35,
    health: tankHealth((currentLitres / capacityLitres) * 100),
  };
}