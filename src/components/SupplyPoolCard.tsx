import { Pressable, Text, View } from 'react-native';
import {
  Check,
  Clock,
  MapPin,
  Share2,
  Users,
} from 'lucide-react-native';
import { Card, Chip, ProgressBar } from '@/components/ui';
import { formatLitres, formatMoney } from '@/lib/format';
import type { SupplyPool } from '@/types';

export default function SupplyPoolCard({
  pool,
  onJoin,
  onShare,
}: {
  pool: SupplyPool;
  onJoin: () => void;
  onShare: () => void;
}) {
  const filled = pool.committedLitres / pool.targetLitres;
  const membersLeft = Math.max(0, pool.targetMembers - pool.membersCount);

  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-slate-900">{pool.name}</Text>
            <Chip label={pool.joined ? 'Joined' : `${membersLeft} slots open`} accent={pool.joined ? '#16a34a' : '#0284c7'} />
          </View>
          <Text className="mt-0.5 text-[11px] text-slate-500">
            {pool.zone} · {pool.distanceKm.toFixed(1)} km away
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-extrabold text-hydro-700">{formatMoney(pool.costPerLitre)}</Text>
          <Text className="text-[11px] text-slate-400 line-through">{formatMoney(pool.standardCostPerLitre)}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Users size={14} color="#0284c7" />
          <Text className="text-xs font-semibold text-slate-700">
            {pool.membersCount}/{pool.targetMembers} households
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MapPin size={14} color="#64748b" />
          <Text className="text-xs text-slate-500">{formatLitres(pool.committedLitres)} committed</Text>
        </View>
      </View>

      <ProgressBar fraction={filled} color="#0ea5e9" className="mt-2.5" />
      <View className="mt-1 justify-between">
        <Text className="text-[10px] text-slate-400">
          {Math.round(filled * 100)}% of a full {formatLitres(pool.targetLitres)} tanker
        </Text>
        <View className="flex-row items-center gap-1 self-end">
          <Clock size={11} color="#64748b" />
          <Text className="text-[11px] font-medium text-slate-600">{pool.refillEta}</Text>
        </View>
      </View>

      <View className="mt-2 flex-row gap-2">
        <Pressable
          onPress={onJoin}
          disabled={pool.joined}
          className={`flex-1 items-center rounded-2xl py-2.5 ${
            pool.joined ? 'bg-green-50' : 'bg-hydro-600'
          }`}
        >
          <View className="flex-row items-center gap-1.5">
            {pool.joined ? <Check size={15} color="#16a34a" /> : null}
            <Text className={`text-sm font-bold ${pool.joined ? 'text-green-700' : 'text-white'}`}>
              {pool.joined ? 'In this pool' : 'Join pool'}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onShare}
          className="items-center justify-center rounded-2xl border border-slate-200 px-3"
        >
          <Share2 size={16} color="#475569" />
        </Pressable>
      </View>
    </Card>
  );
}