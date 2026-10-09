import { Text, View } from 'react-native';
import { Svg, Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { tankHealthColor } from '@/constants/theme';
import { formatLitres } from '@/lib/format';
import type { WaterLevelForecast } from '@/types';

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 82;
const STROKE = 16;

function arc(cx: number, cy: number, r: number, u0: number, u1: number): string {
  const a0 = Math.PI + u0 * Math.PI;
  const a1 = Math.PI + u1 * Math.PI;
  const sx = cx + r * Math.cos(a0);
  const sy = cy + r * Math.sin(a0);
  const ex = cx + r * Math.cos(a1);
  const ey = cy + r * Math.sin(a1);
  const large = u1 - u0 > 0.5 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function polar(cx: number, cy: number, r: number, u: number) {
  const a = Math.PI + u * Math.PI;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function TankMeter({ data }: { data: WaterLevelForecast }) {
  const fraction = Math.min(1, Math.max(0, data.currentLitres / data.capacityLitres));
  const color = tankHealthColor(data.health);
  const needleTip = polar(CX, CY, R * 0.62, fraction);
  const needleBase = polar(CX, CY, R * 0.18, fraction);

  return (
    <View className="items-center">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Path
          d={arc(CX, CY, R, 0, 1)}
          stroke="#e2e8f0"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arc(CX, CY, R, 0, fraction)}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <G>
          {[0, 0.25, 0.5, 0.75, 1].map((u) => {
            const outer = polar(CX, CY, R + 9, u);
            const inner = polar(CX, CY, R - 11, u);
            return (
              <Line
                key={u}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="#94a3b8"
                strokeWidth={2}
              />
            );
          })}
        </G>
        <Line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#0f172a"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Circle cx={CX} cy={CY} r={8} fill="#0f172a" />
        <Circle cx={CX} cy={CY} r={3.5} fill="#fff" />
        {[0, 25, 50, 75, 100].map((v, i) => {
          const p = polar(CX, CY, R + 27, i / 4);
          return (
            <SvgText
              key={v}
              x={p.x}
              y={p.y}
              fontSize={9}
              fill="#94a3b8"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {v}%
            </SvgText>
          );
        })}
      </Svg>
      <View className="absolute justify-center" style={{ top: 0, bottom: 0 }}>
        <View className="items-center">
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className="text-3xl font-extrabold text-slate-900">
              {Math.round(fraction * 100)}%
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-500">
            {formatLitres(data.currentLitres)} of {formatLitres(data.capacityLitres)}
          </Text>
        </View>
      </View>
    </View>
  );
}