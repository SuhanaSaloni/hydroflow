import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { Screen, SectionHeader } from '@/components/ui';
import SupplyPoolCard from '@/components/SupplyPoolCard';
import { FAMILY_ID } from '@/constants/app';
import { api } from '@/lib/api';
import type { SupplyPool } from '@/types';

export default function PoolsScreen() {
  const [pools, setPools] = useState<SupplyPool[] | null>(null);

  useEffect(() => {
    api.pools(FAMILY_ID).then(setPools);
  }, []);

  const joinPool = useCallback(async (poolId: string) => {
    setPools((prev) => prev?.map((p) => (p.id === poolId ? { ...p, joined: true, membersCount: p.membersCount + 1 } : p)) ?? prev);
    try {
      await api.joinPool(poolId, FAMILY_ID);
    } catch {
      // offline demo path
    }
  }, []);

  const sharePool = useCallback((pool: SupplyPool) => {
    // In a real build this would invoke the native share sheet.
    void pool;
  }, []);

  return (
    <Screen>
      <View className="px-5 pt-2">
        <Text className="text-xl font-extrabold text-slate-900">Community Supply Pools</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Join a nearby block-order pool. When a pool reaches 10,000 L of committed demand, a full
          tanker is dispatched to all members at a bulk rate — every member saves.
        </Text>
      </View>
      <SectionHeader title="Active pools near you" subtitle="Nearest first" icon={Users} />
      <View className="px-4">
        {pools?.map((p) => (
          <SupplyPoolCard key={p.id} pool={p} onJoin={() => joinPool(p.id)} onShare={() => sharePool(p)} />
        ))}
      </View>
    </Screen>
  );
}