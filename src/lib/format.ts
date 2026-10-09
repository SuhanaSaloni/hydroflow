export const formatLitres = (litres: number): string =>
  litres >= 1000 ? `${(litres / 1000).toFixed(1)}k L` : `${Math.round(litres)} L`;

export const formatMoney = (perLitre: number): string =>
  `₹${perLitre.toFixed(2)}/L`;

export const formatHours = (hours: number): string =>
  hours < 1
    ? `${Math.round(hours * 60)} min`
    : hours < 24
      ? `${Math.round(hours)} h`
      : `${(hours / 24).toFixed(1)} days`;

export const formatEta = (minutes: number): string =>
  minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`;

export const pct = (part: number, whole: number): number =>
  whole <= 0 ? 0 : Math.min(100, Math.max(0, (part / whole) * 100));