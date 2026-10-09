import { Text, View } from 'react-native';
import { Svg, Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { DeliveryRun, DeliveryStop } from '@/types';

const W = 340;
const H = 250;
const PAD = 26;

type Pt = { x: number; y: number };

function project(stops: DeliveryRun['stops'], lat: number, lon: number): Pt | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const lats = stops.map((s) => s.lat).filter((n) => Number.isFinite(n));
  const lons = stops.map((s) => s.lon).filter((n) => Number.isFinite(n));
  const minLat = Math.min(...lats, lat);
  const maxLat = Math.max(...lats, lat);
  const minLon = Math.min(...lons, lon);
  const maxLon = Math.max(...lons, lon);
  const spanLat = Math.max(maxLat - minLat, 0.004);
  const spanLon = Math.max(maxLon - minLon, 0.004);
  const x = PAD + ((lon - minLon) / spanLon) * (W - PAD * 2);
  const y = PAD + (1 - (lat - minLat) / spanLat) * (H - PAD * 2);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

const statusColor: Record<string, string> = {
  DELIVERED: '#94a3b8',
  IN_TRANSIT: '#0284c7',
  PENDING: '#0f172a',
};

export default function DeliveryMap({
  run,
  selectedIndex,
  onSelect,
}: {
  run: DeliveryRun;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const points = run.stops
    .map((s) => ({ stop: s, pt: project(run.stops, s.lat, s.lon) }))
    .filter((e): e is { stop: DeliveryStop; pt: Pt } => e.pt != null);
  const centre =
    project(run.stops, run.clusterCentre.lat, run.clusterCentre.lon) ?? { x: W / 2, y: H / 2 };
  const route = points
    .map(({ pt: p }, i) => {
      const x = p?.x ?? 0;
      const y = p?.y ?? 0;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const scale = 1 + run.radiusKm * 6;

  return (
    <View className="overflow-hidden rounded-3xl bg-slate-900">
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} fill="#0f172a" />
        <G stroke="#1e293b" strokeWidth={1}>
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((u) => (
            <Line key={u} x1={0} y1={H * u} x2={W} y2={H * u} />
          ))}
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((u) => (
            <Line key={u} x1={W * u} y1={0} x2={W * u} y2={H} />
          ))}
        </G>
        <Circle
          cx={centre.x}
          cy={centre.y}
          r={Math.min(W / 2 - 8, 58 * scale * 0.9)}
          fill="rgba(14,165,233,0.06)"
          stroke="#0ea5e9"
          strokeOpacity={0.35}
          strokeDasharray="4 5"
        />
        <Path d={route} stroke="#38bdf8" strokeWidth={2.5} strokeLinejoin="round" fill="none" />

        {points.map(({ stop: s, pt: p }) => {
          const selected = s.index === selectedIndex;
          const delivered = s.status === 'DELIVERED';
          const x = p?.x ?? 0;
          const y = p?.y ?? 0;
          return (
            <G key={s.householdId} onPress={() => onSelect(s.index)}>
              <Circle
                cx={x}
                cy={y}
                r={selected ? 19 : 16}
                fill={selected ? 'rgba(255,255,255,0.08)' : 'transparent'}
              />
              <Circle
                cx={x}
                cy={y}
                r={12}
                fill={delivered ? '#334155' : '#0284c7'}
                stroke={selected ? '#7dd3fc' : '#0f172a'}
                strokeWidth={selected ? 2 : 1}
              />
              <SvgText
                x={x}
                y={y + 0.5}
                fontSize={11}
                fontWeight={delivered ? '500' : '800'}
                fill={delivered ? '#94a3b8' : '#fff'}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {s.index}
              </SvgText>
            </G>
          );
        })}

        <SvgText x={W - 12} y={20} fontSize={10} fill="#94a3b8" textAnchor="end">
          cluster · {run.radiusKm.toFixed(1)} km
        </SvgText>
      </Svg>
      <View className="flex-row items-center justify-between border-t border-slate-800 px-4 py-2">
        <Legend color={statusColor.DELIVERED} label="Delivered" />
        <Legend color={statusColor.IN_TRANSIT} label="Discharging now" />
        <Legend color={statusColor.PENDING} label="Upcoming" />
        <Text className="text-[10px] text-slate-400">Total route {run.totalDistanceKm} km</Text>
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[10px] text-slate-400">{label}</Text>
    </View>
  );
}