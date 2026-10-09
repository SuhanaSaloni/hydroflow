import { Text, View } from 'react-native';
import {
  BadgeCheck,
  Droplets,
  FlaskConical,
  ShieldCheck,
  Star,
  StarHalf,
  Truck,
} from 'lucide-react-native';
import { Card, Chip } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { WaterPassport } from '@/types';

function Rating({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
      ))}
      {half ? <StarHalf size={12} fill="#f59e0b" color="#f59e0b" /> : null}
      <Text className="ml-1 text-xs font-bold text-slate-800">{score.toFixed(1)}</Text>
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  children,
  iconColor = colors.hydro[600],
}: {
  icon: typeof Droplets;
  label: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="items-center justify-center rounded-xl bg-slate-50 p-2">
        <Icon size={16} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-medium text-slate-500">{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function WaterPassportCard({ passport }: { passport: WaterPassport }) {
  return (
    <Card>
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="rounded-2xl bg-hydro-600 p-2">
            <Droplets size={18} color="#fff" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-900">Digital Water Passport</Text>
            <Text className="text-[11px] text-slate-500">Quality · Safety · Traceability</Text>
          </View>
        </View>
        <Chip label={passport.labCertified ? 'Lab Certified' : 'Field Tested'} accent="#16a34a" icon={BadgeCheck} />
      </View>

      <View className="my-1 h-px bg-slate-100" />

      <Row icon={FlaskConical} label="Last TDS level" iconColor={colors.hydro[700]}>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-lg font-bold text-slate-900">{passport.lastTdsPpm}</Text>
          <Text className="text-[11px] text-slate-500">ppm · WHO safe &lt; 500</Text>
        </View>
      </Row>

      <Row icon={BadgeCheck} label="Source borewell">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-semibold text-slate-800">{passport.borewell.name}</Text>
          <Text className="text-[11px] text-slate-500">· {passport.borewell.location}</Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="text-[11px] text-slate-500">pH {passport.borewell.ph}</Text>
          <Text className="text-[11px] text-slate-400">•</Text>
          <Text className="text-[11px] text-slate-500">Yield {passport.borewell.yieldLph} L/h</Text>
          <Text className="text-[11px] text-slate-400">•</Text>
          <Text className="text-[11px] text-slate-500">Tested {passport.borewell.lastTestedAt}</Text>
        </View>
      </Row>

      <Row icon={ShieldCheck} label="Driver safety rating" iconColor={colors.success}>
        <Rating score={passport.driver.safetyRating} />
        <Text className="text-[11px] text-slate-500">{passport.driver.name}</Text>
      </Row>

      <Row icon={Truck} label="Vehicle capacity" iconColor={colors.warning}>
        <Text className="text-sm font-semibold text-slate-800">10,000 L</Text>
        <Text className="text-[11px] text-slate-500">
          {passport.vehicle.plate} · Safety inspected {passport.vehicle.lastSafetyInspection}
        </Text>
      </Row>
    </Card>
  );
}